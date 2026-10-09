#include "storage.h"
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>
#ifdef PS5
#include <sys/ioctl.h>
#include <sys/mdioctl.h>
#include <sys/mount.h>
#include <sys/uio.h>
#include <sys/sysctl.h>
#include <sys/user.h>
#endif

char storage_error[512], storage_backup[512];
static char direct_file[512], backup_dir[512];
static int blocked;
#ifdef PS5
static const char *image_path = "/user/download/PPSA01317/download0.dat";
static const char *live_dir = "/mnt/sandbox/download/PPSA01317";
static const char *mount_dir = "/data/gt7-save-lab/mount";
static int owned_mount, device_attached;
static unsigned device_unit;
int sceKernelGetAppInfo(pid_t pid, void *info);
#endif

static int fail(const char *message) {
    snprintf(storage_error, sizeof(storage_error), "%s (errno %d: %s)", message, errno, strerror(errno));
    return -1;
}
static uint32_t le32(const uint8_t *p) {
    return (uint32_t)p[0] | (uint32_t)p[1]<<8 | (uint32_t)p[2]<<16 | (uint32_t)p[3]<<24;
}
int save_valid(const uint8_t *data, size_t size) {
    if (!size || size > SAVE_LIMIT) return 0;
    size_t offset = 0, count = 0;
    char names[512][33];
    int garage = 0, progress = 0;
    while (offset < size) {
        if (size-offset < 56 || count >= 512) return 0;
        const uint8_t *h = data+offset;
        uint32_t length = le32(h+12);
        if (length > size-offset-56) return 0;
        size_t n = 0;
        while (n < 32 && h[24+n]) {
            if (!((h[24+n]>='A' && h[24+n]<='Z') || (h[24+n]>='0' && h[24+n]<='9') || h[24+n]=='_')) return 0;
            n++;
        }
        if (!n || n == 32) return 0;
        for (size_t j=n;j<32;j++) if (h[24+j]) return 0;
        memcpy(names[count],h+24,n); names[count][n]=0;
        for (size_t j=0;j<count;j++) if (!strcmp(names[j],names[count])) return 0;
        if (!strcmp(names[count],"GARAGE")) garage=1;
        if (!strcmp(names[count],"PROGRESS")) progress=1;
        count++; offset += 56+length;
    }
    return offset==size && garage && progress;
}
int save_patch_valid(const uint8_t *a, const uint8_t *b, size_t size) {
    return save_edit_valid(a,size,b,size);
}
static unsigned be16(const uint8_t *p){return (unsigned)p[0]*256+p[1];}
static int gift_layout(const uint8_t *p,size_t size){
    if(size<66 || memcmp(p,"GFIV",4))return 0;
    unsigned count=be16(p+64);if(size!=66+450u*count)return 0;
    for(unsigned i=0;i<count;i++){
        if(be16(p+66+2*i)!=i || memcmp(p+66+2*count+448*i,"GFIT",4))return 0;
    }return 1;
}
static int gifts_subset(const uint8_t *a,size_t asize,const uint8_t *b,size_t bsize){
    if(!gift_layout(a,asize)||!gift_layout(b,bsize)||bsize>=asize||memcmp(a,b,64))return 0;
    unsigned oldcount=be16(a+64),newcount=be16(b+64),j=0;
    for(unsigned i=0;i<newcount;i++){
        const uint8_t *entry=b+66+2*newcount+448*i;
        while(j<oldcount && memcmp(a+66+2*oldcount+448*j,entry,448))j++;
        if(j==oldcount)return 0;
        j++;
    }return 1;
}
int save_edit_valid(const uint8_t *a,size_t asize,const uint8_t *b,size_t bsize){
    if(!save_valid(a,asize)||!save_valid(b,bsize))return 0;
    size_t ao=0,bo=0;
    while(ao<asize && bo<bsize){
        uint32_t al=le32(a+ao+12),bl=le32(b+bo+12);
        /* Only GIFTIV length may change; all other header bytes are immutable. */
        if(memcmp(a+ao,b+bo,12)||memcmp(a+ao+16,b+bo+16,40))return 0;
        if(!strcmp((const char*)a+ao+24,"GIFTIV")){
            if(al==bl){if(memcmp(a+ao+56,b+bo+56,al))return 0;}
            else if(!gifts_subset(a+ao+56,al,b+bo+56,bl))return 0;
        }else if(al!=bl)return 0;
        ao+=56+al;bo+=56+bl;
    }return ao==asize && bo==bsize;
}
void storage_init(const char *file, const char *backups) {
    if (file) snprintf(direct_file,sizeof(direct_file),"%s",file);
    snprintf(backup_dir,sizeof(backup_dir),"%s",backups ? backups : "/data/gt7-save-lab/backups");
}
int storage_blocked(void) { return blocked; }
int storage_running(void) {
#ifdef PS5
    int mib[4]={CTL_KERN,KERN_PROC,KERN_PROC_PROC,0};
    size_t size=0;
    if (sysctl(mib,4,NULL,&size,NULL,0) || !size || size>32*1024*1024) return -1;
    unsigned char *buf=malloc(size);
    if (!buf) return -1;
    if (sysctl(mib,4,buf,&size,NULL,0)) { free(buf); return -1; }
    int result=0;
    for (size_t o=0;o<size;) {
        if (size-o<sizeof(struct kinfo_proc)) {result=-1;break;}
        struct kinfo_proc *ki=(struct kinfo_proc*)(buf+o);
        if (ki->ki_structsize < (int)sizeof(*ki) || (size_t)ki->ki_structsize>size-o) {result=-1;break;}
        /* SDK versions describe two layouts. Search the returned fixed buffer
           for the exact title ID rather than assuming its offset. */
        unsigned char info[256]={0};
        if (!sceKernelGetAppInfo(ki->ki_pid,info)) {
            for (size_t j=0;j+10<=sizeof(info);j++) {
                if (!memcmp(info+j,"PPSA01317",9) && !info[j+9]) {result=1;break;}
            }
        }
        if (result==1) break;
        o+=(size_t)ki->ki_structsize;
    }
    free(buf); return result;
#else
    return 0;
#endif
}

#ifdef PS5
static int mount_cleanup(void) {
    if (owned_mount) {
        if (unmount(mount_dir,0)) { blocked=1;return fail("Unmount failed; do not launch GT7. Reboot to clear the editor mount"); }
        owned_mount=0;
    }
    if (device_attached) {
        int fd=open("/dev/mdctl",O_RDWR);
        if (fd<0) {blocked=1;return fail("Cannot detach editor MD device; reboot before launching GT7");}
        struct md_ioctl md={0};md.md_version=MDIOVERSION;md.md_unit=device_unit;
        int ret=ioctl(fd,MDIOCDETACH,&md);close(fd);
        if (ret) {blocked=1;return fail("Cannot detach editor MD device; reboot before launching GT7");}
        device_attached=0;
    }
    return 0;
}
static int live_mounted(void) {
    struct statfs *mounts=NULL;
    int count=getmntinfo(&mounts,MNT_NOWAIT);
    if (count<=0) return -1;
    for (int i=0;i<count;i++) {
        if (!strcmp(mounts[i].f_mntonname,live_dir)) return 1;
        if (!strcmp(mounts[i].f_mntonname,mount_dir)) return 2;
    }
    return 0;
}
#endif

static int begin_access(int writing, char path[512]) {
    storage_error[0]=0;
    if (blocked) {errno=EBUSY;return fail("Editor mount cleanup failed earlier; reboot required");}
    if (direct_file[0]) {snprintf(path,512,"%s",direct_file);return 0;}
#ifdef PS5
    int running=storage_running(), mounted=live_mounted();
    if (mounted<0) return fail("Cannot query console mounts");
    if (mounted==2) {errno=EBUSY;return fail("Editor mount already exists; reboot to clear it");}
    if (!writing && mounted==1) {
        snprintf(path,512,"%s/gt7save.bin",live_dir);return 0;
    }
    if (running!=0 || mounted) {errno=EBUSY;return fail("Close GT7 completely before editing or offline mounting; process/mount check must succeed");}
    if (mkdir("/data/gt7-save-lab",0700) && errno!=EEXIST) return fail("Create editor directory");
    if (mkdir(mount_dir,0700) && errno!=EEXIST) return fail("Create mount directory");
    struct stat st;
    if (stat(image_path,&st) || !S_ISREG(st.st_mode)) return fail("Find download0.dat");
    int fd=open("/dev/mdctl",O_RDWR);
    if (fd<0) return fail("Open /dev/mdctl; loader needs filesystem and mount privileges");
    struct md_ioctl md={0};md.md_version=MDIOVERSION;md.md_type=MD_VNODE;
    md.md_file=(char*)image_path;md.md_mediasize=st.st_size;md.md_sectorsize=512;
    md.md_options=MD_AUTOUNIT | (writing ? 0 : MD_READONLY);
    int ret=ioctl(fd,MDIOCATTACH,&md);close(fd);
    if (ret) return fail("Attach download0.dat as MD device");
    device_attached=1;device_unit=md.md_unit;
    char dev[64];snprintf(dev,sizeof(dev),"/dev/md%u",device_unit);
    char *values[]={"fstype","ufs","fspath",(char*)mount_dir,"from",dev};
    struct iovec iov[6];
    for (int i=0;i<6;i++){iov[i].iov_base=values[i];iov[i].iov_len=strlen(values[i])+1;}
    if (nmount(iov,6,writing ? 0 : MNT_RDONLY)) {
        fail("Mount UFS image (no forced mount or repair attempted)");mount_cleanup();return -1;
    }
    owned_mount=1;snprintf(path,512,"%s/gt7save.bin",mount_dir);return 0;
#else
    (void)writing;(void)path;errno=ENOENT;return fail("Use --file with the host build");
#endif
}
static int end_access(void) {
#ifdef PS5
    return mount_cleanup();
#else
    return 0;
#endif
}
static int load_file(const char *path,uint8_t **data,size_t *size) {
    int fd=open(path,O_RDONLY|O_NOFOLLOW);
    if (fd<0) return fail("Open gt7save.bin");
    struct stat st;
    if (fstat(fd,&st) || !S_ISREG(st.st_mode) || st.st_size<=0 || st.st_size>SAVE_LIMIT) {
        close(fd);errno=EINVAL;return fail("Save size or type invalid");
    }
    *size=(size_t)st.st_size;*data=malloc(*size);
    if (!*data) {close(fd);return fail("Allocate save buffer");}
    size_t n=0;
    while(n<*size) {
        ssize_t r=read(fd,*data+n,*size-n);
        if(r<=0){free(*data);*data=NULL;close(fd);return fail("Read complete save");}n+=(size_t)r;
    }
    uint8_t extra;ssize_t trailing=read(fd,&extra,1);close(fd);
    if(trailing!=0 || !save_valid(*data,*size)) {
        free(*data);*data=NULL;errno=EINVAL;return fail("Save changed or record format is unsupported");
    }
    return 0;
}
int storage_read(uint8_t **data,size_t *size) {
    char path[512];*data=NULL;
    if(begin_access(0,path)) return -1;
    int ret=load_file(path,data,size);
    /* Two equal reads avoid publishing a snapshot captured mid-save. */
    if(!ret) {
        uint8_t *check=NULL;size_t length=0;
        if(load_file(path,&check,&length) || length!=*size || memcmp(*data,check,*size)) {
            errno=EBUSY;ret=fail("Save changed during read; retry after saving finishes");
        }
        free(check);
    }
    if(end_access())ret=-1;
    if(ret){free(*data);*data=NULL;}return ret;
}
static int write_all(int fd,const uint8_t *data,size_t size) {
    size_t offset=0;
    while(offset<size){ssize_t n=write(fd,data+offset,size-offset);if(n<=0)return -1;offset+=(size_t)n;}
    return fsync(fd);
}
int storage_apply(const uint8_t *expected,const uint8_t *updated,size_t size) {
    return storage_apply_v2(expected,size,updated,size);
}
int storage_apply_v2(const uint8_t *expected,size_t size,const uint8_t *updated,size_t updated_size) {
    storage_backup[0]=0;
    if(!save_edit_valid(expected,size,updated,updated_size)) {errno=EINVAL;return fail("Invalid edit: only payload changes and order-preserving gift removal are supported");}
    if(size==updated_size&&!memcmp(expected,updated,size)){errno=EINVAL;return fail("No changes staged");}
    char path[512],temp[560]={0};uint8_t *current=NULL;size_t length=0;int ret=-1;
    if(begin_access(1,path)) return -1;
    if(load_file(path,&current,&length)) goto done;
    if(length!=size || memcmp(current,expected,size)){errno=EBUSY;fail("Stale snapshot: reload the console save and reapply edits");goto done;}
    struct stat st;
    if(lstat(path,&st)){fail("Read original permissions");goto done;}
    if(mkdir(backup_dir,0700) && errno!=EEXIST){fail("Create backup directory");goto done;}
    if(snprintf(storage_backup,sizeof(storage_backup),"%s/gt7save-XXXXXX",backup_dir)>=(int)sizeof(storage_backup)){errno=ENAMETOOLONG;fail("Backup path too long");goto done;}
    int backup=mkstemp(storage_backup);
    if(backup<0){fail("Create backup file");goto done;}
    int written=write_all(backup,current,size);close(backup);
    if(written){fail("Write backup; save left unchanged");goto done;}
    uint8_t *verified=NULL;size_t verified_size=0;
    if(load_file(storage_backup,&verified,&verified_size) || verified_size!=size || memcmp(verified,current,size)) {
        free(verified);fail("Backup verification failed; save left unchanged");goto done;
    }
    free(verified);
    snprintf(temp,sizeof(temp),"%s.lab-XXXXXX",path);
    int fd=mkstemp(temp);
    if(fd<0){fail("Create replacement save");goto done;}
    int perms=fchmod(fd,st.st_mode & 0777);
    int owner=fchown(fd,st.st_uid,st.st_gid);
    written=write_all(fd,updated,updated_size);close(fd);
    if(perms || owner || written){fail("Write replacement save/permissions");goto done;}
    verified=NULL;
    if(load_file(temp,&verified,&verified_size) || verified_size!=updated_size || memcmp(verified,updated,updated_size)) {
        free(verified);fail("Replacement verification failed");goto done;
    }
    free(verified);free(current);current=NULL;
    if(load_file(path,&current,&length) || length!=size || memcmp(current,expected,size)) {
        errno=EBUSY;fail("Save changed before commit; replacement cancelled");goto done;
    }
#ifdef PS5
    if(storage_running()!=0){errno=EBUSY;fail("GT7 started or process check failed; commit cancelled");goto done;}
#endif
    if(rename(temp,path)){fail("Replace save atomically");goto done;}
    temp[0]=0;
    char parent[512];snprintf(parent,sizeof(parent),"%s",path);char *slash=strrchr(parent,'/');
    if(slash){*slash=0;int dir=open(parent,O_RDONLY);if(dir>=0){fsync(dir);close(dir);}}
    ret=0;
done:
    if(temp[0])unlink(temp);
    free(current);
    if(end_access())ret=-1;
    return ret;
}
