/* Uses the public PS5 SDK registration API and web-shortcut param.json schema.
 * References are documented in README.md; implementation is local to Save Lab. */
#include "launcher.h"
#include <stdio.h>
#include <string.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <unistd.h>
#ifdef PS5
#include <stdint.h>
#include <ps5/kernel.h>
#include <dlfcn.h>
#include "launcher_assets.h"
static int initialized;
static void *installer_library;
static int (*initialize_installer)(void);
static int (*install_all)(void *);
static const char *base="/user/app/GTSL08097";
static int write_asset(const char *path,const unsigned char *data,size_t size){
    int fd=open(path,O_WRONLY|O_CREAT|O_EXCL,0644);
    if(fd<0)return errno==EEXIST?0:-1;
    size_t done=0;
    while(done<size){ssize_t n=write(fd,data+done,size-done);if(n<=0){close(fd);unlink(path);return -1;}done+=(size_t)n;}
    int ret=fsync(fd);close(fd);return ret;
}
#endif
char launcher_status[256]="Launcher not installed yet.";
int launcher_install(void){
#ifdef PS5
    const char *marker="/user/app/GTSL08097/.save-lab-installed";
    if(access(marker,F_OK)==0){snprintf(launcher_status,sizeof(launcher_status),"GT7 Save Lab shortcut is installed in Media.");return 0;}
    if(!initialized){
        if(!installer_library)installer_library=dlopen("libSceAppInstUtil.sprx",RTLD_LAZY);
        if(!installer_library){snprintf(launcher_status,sizeof(launcher_status),"Shortcut library load failed: %.160s",dlerror());return -1;}
        initialize_installer=(void*)dlsym(installer_library,"sceAppInstUtilInitialize");
        install_all=(void*)dlsym(installer_library,"sceAppInstUtilAppInstallAll");
        if(!initialize_installer){snprintf(launcher_status,sizeof(launcher_status),"Shortcut initialization API is unavailable.");return -1;}
        int code=initialize_installer();if(code){snprintf(launcher_status,sizeof(launcher_status),"Shortcut initialization failed: 0x%08x. Browser access still works.",code);return -1;}initialized=1;
    }
    if((mkdir(base,0755)&&errno!=EEXIST)||(mkdir("/user/app/GTSL08097/sce_sys",0755)&&errno!=EEXIST))goto fail;
    if(write_asset("/user/app/GTSL08097/sce_sys/param.json",launcher_param,sizeof(launcher_param))||write_asset("/user/app/GTSL08097/sce_sys/icon0.png",launcher_icon,sizeof(launcher_icon)))goto fail;
    uint32_t handle=0;int (*install_title)(const char*,const char*,void*)=NULL;
    if(!kernel_dynlib_handle(-1,"libSceAppInstUtil.sprx",&handle))install_title=(void*)kernel_dynlib_resolve(-1,handle,"Wudg3Xe3heE");
    if(!install_title && !install_all){snprintf(launcher_status,sizeof(launcher_status),"Shortcut registration API is unavailable.");return -1;}
    int code=install_title?install_title("GTSL08097","/user/app/",NULL):install_all(NULL);
    if(code){snprintf(launcher_status,sizeof(launcher_status),"Shortcut registration failed: 0x%08x. Retry installation from the web UI.",code);return -1;}
    if(write_asset(marker,(const unsigned char*)"0.2.0\n",6))goto fail;
    snprintf(launcher_status,sizeof(launcher_status),"GT7 Save Lab shortcut installed in Media. It opens port 8097; keep the payload running.");return 0;
fail:
    snprintf(launcher_status,sizeof(launcher_status),"Shortcut files could not be installed: %s. Browser access still works.",strerror(errno));return -1;
#else
    snprintf(launcher_status,sizeof(launcher_status),"Home-screen installation is available only in the PS5 ELF.");return -1;
#endif
}
