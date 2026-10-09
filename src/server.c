#include "storage.h"
#include "launcher.h"
#include "assets.h"
#include <arpa/inet.h>
#include <ctype.h>
#include <errno.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/socket.h>
#include <sys/time.h>
#include <unistd.h>
#include <stdarg.h>
#include <ifaddrs.h>
#include <sys/stat.h>

static void diagnostic(const char *format,...){
    char message[1024];va_list args;va_start(args,format);vsnprintf(message,sizeof(message),format,args);va_end(args);
#ifdef PS5
    /* Debug-notification ABI used by the SDK notify_debug sample. */
    struct {char reserved[45];char message[3075];} notification={0};
    int sceKernelSendNotificationRequest(int,void*,size_t,int);
    snprintf(notification.message,sizeof(notification.message),"%s",message);
    sceKernelSendNotificationRequest(0,&notification,sizeof(notification),0);
    /* Notify before filesystem I/O. Avoid inherited stdout/stderr pipes on PS5:
       a loader can leave them undrained or disconnected. */
    mkdir("/data/gt7-save-lab",0755);
    FILE *log=fopen("/data/gt7-save-lab/startup.log","a");
    if(log){fprintf(log,"pid %d: %s\n",(int)getpid(),message);fclose(log);}
#else
    fprintf(stderr,"%s\n",message);fflush(stderr);
#endif
}
static void announce_address(int port){
    struct ifaddrs *addresses=NULL;int found=0;
    if(!getifaddrs(&addresses)){
        for(struct ifaddrs *a=addresses;a;a=a->ifa_next){
            if(!a->ifa_addr||a->ifa_addr->sa_family!=AF_INET)continue;
            struct sockaddr_in *v=(struct sockaddr_in*)a->ifa_addr;
            uint32_t ip=ntohl(v->sin_addr.s_addr);if(!ip||(ip>>24)==127)continue;
            char text[INET_ADDRSTRLEN];if(inet_ntop(AF_INET,&v->sin_addr,text,sizeof(text))){diagnostic("GT7 Save Lab 0.4.1 ready\nhttp://%s:%d/",text,port);found=1;break;}
        }freeifaddrs(addresses);
    }
    if(!found)diagnostic("GT7 Save Lab 0.4.1 ready on port %d\nConsole: http://127.0.0.1:%d/\nLAN: use this console's IP address",port,port);
}

static char token[65];
static volatile sig_atomic_t stopping;
static void stop_server(int sig){(void)sig;stopping=1;}
static int send_all(int fd,const void *data,size_t size){
    const char *p=data;
    while(size){ssize_t n=send(fd,p,size,0);if(n<=0)return -1;p+=n;size-=(size_t)n;}return 0;
}
static void response(int fd,int status,const char *type,const void *body,size_t length){
    char header[1024];
    int n=snprintf(header,sizeof(header),
        "HTTP/1.1 %d %s\r\nContent-Type: %s\r\nContent-Length: %zu\r\n"
        "Connection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n"
        "Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; object-src 'none'\r\n\r\n",
        status,status==200?"OK":"Error",type,length);
    if(n>0 && (size_t)n<sizeof(header) && !send_all(fd,header,(size_t)n))send_all(fd,body,length);
}
static void json_quote(char *out,size_t limit,const char *text){
    size_t n=0;
    for(const unsigned char *p=(const unsigned char*)text;*p && n+7<limit;p++){
        if(*p=='"' || *p=='\\'){out[n++]='\\';out[n++]=(char)*p;}
        else if(*p<32){n+=(size_t)snprintf(out+n,limit-n,"\\u%04x",*p);}
        else out[n++]=(char)*p;
    }
    out[n]=0;
}
static void error_response(int fd,int code,const char *message){
    char escaped[2048],body[2200];json_quote(escaped,sizeof(escaped),message);
    snprintf(body,sizeof(body),"{\"error\":\"%s\"}",escaped);
    response(fd,code,"application/json",body,strlen(body));
}
static int valid_host(const char *host){
    char copy[128];if(!*host || strlen(host)>=sizeof(copy))return 0;
    strcpy(copy,host);char *colon=strchr(copy,':');
    if(colon){*colon++=0;if(!*colon)return 0;for(char *p=colon;*p;p++)if(!isdigit((unsigned char)*p))return 0;}
    struct in_addr a;
    return !strcmp(copy,"localhost") || inet_pton(AF_INET,copy,&a)==1;
}
static void handle(int fd){
    char header[8192];size_t used=0;char *end=NULL;
    while(used<sizeof(header)-1){
        ssize_t n=recv(fd,header+used,1,0);if(n<=0)return;used+=(size_t)n;header[used]=0;
        if(used>=4 && !memcmp(header+used-4,"\r\n\r\n",4)){end=header+used;break;}
    }
    if(!end){error_response(fd,431,"Headers too large");return;}
    char method[16],url[128],version[16],extra;
    char *line_end=strstr(header,"\r\n");if(!line_end)return;*line_end=0;
    if(sscanf(header,"%15s %127s %15s %c",method,url,version,&extra)!=3 || strcmp(version,"HTTP/1.1")){
        error_response(fd,400,"Invalid HTTP request");return;
    }
    char *host=NULL,*origin=NULL,*auth=NULL,*length=NULL;int invalid=0;
    for(char *line=line_end+2;*line && strncmp(line,"\r\n",2);){
        char *next=strstr(line,"\r\n");if(!next){invalid=1;break;}*next=0;
        char *colon=strchr(line,':');if(!colon){invalid=1;break;}*colon++=0;
        while(*colon==' ' || *colon=='\t')colon++;
        char *tail=colon+strlen(colon);while(tail>colon && (tail[-1]==' ' || tail[-1]=='\t'))*--tail=0;
        char **dest=NULL;
        if(!strcasecmp(line,"Host"))dest=&host;
        if(!strcasecmp(line,"Origin"))dest=&origin;
        if(!strcasecmp(line,"X-Editor-Token"))dest=&auth;
        if(!strcasecmp(line,"Content-Length"))dest=&length;
        if(!strcasecmp(line,"Transfer-Encoding"))invalid=1;
        if(dest){if(*dest)invalid=1;*dest=colon;}
        line=next+2;
    }
    if(invalid || !host || !valid_host(host)){error_response(fd,400,"Use the console's numeric IP address; invalid request headers");return;}
    if(origin){char expected[160];snprintf(expected,sizeof(expected),"http://%s",host);if(strcmp(origin,expected)){error_response(fd,403,"Cross-origin requests are blocked");return;}}
    size_t content_length=0;
    if(length){
        if(!*length){error_response(fd,400,"Empty content length");return;}
        for(char *p=length;*p;p++)if(!isdigit((unsigned char)*p)){error_response(fd,400,"Invalid content length");return;}
        errno=0;unsigned long long value=strtoull(length,NULL,10);
        if(errno || value>2*SAVE_LIMIT+12){error_response(fd,413,"Request too large");return;}
        content_length=(size_t)value;
    }
    if(!strcmp(method,"GET") && content_length){error_response(fd,400,"GET body unsupported");return;}
    if(!strcmp(method,"GET") && (!strcmp(url,"/") || !strcmp(url,"/index.html"))){response(fd,200,"text/html; charset=utf-8",index_html,sizeof(index_html));return;}
    if(!strcmp(method,"GET") && !strcmp(url,"/core.js")){response(fd,200,"text/javascript; charset=utf-8",core_js,sizeof(core_js));return;}
    if(!strcmp(method,"GET") && !strcmp(url,"/app.js")){response(fd,200,"text/javascript; charset=utf-8",app_js,sizeof(app_js));return;}
    if(!strcmp(method,"GET") && !strcmp(url,"/api/info")){
        char body[512];
        snprintf(body,sizeof(body),"{\"version\":\"0.4.1\",\"token\":\"%s\",\"title\":\"PPSA01317\",\"gameRunning\":%d,\"blocked\":%s,\"platform\":\"%s\"}",
            token,storage_running(),storage_blocked()?"true":"false",
#ifdef PS5
            "PS5"
#else
            "Host test"
#endif
        );response(fd,200,"application/json",body,strlen(body));return;
    }
    if(!auth || strcmp(auth,token)){error_response(fd,403,"Missing session token; reload the page");return;}
    if(!strcmp(method,"POST")&&!strcmp(url,"/api/stop")){
        const char *body="{\"ok\":true,\"message\":\"Payload stopping. Load the next ELF through Payload Manager.\"}";
        response(fd,200,"application/json",body,strlen(body));stopping=1;return;
    }
    if(!strcmp(method,"POST")&&!strcmp(url,"/api/install-shortcut")){
        error_response(fd,409,"Shortcut installation is disabled while its console hang is investigated. The web server remains available.");return;
    }
    if(!strcmp(method,"GET") && !strcmp(url,"/api/save")){
        uint8_t *data=NULL;size_t size=0;
        diagnostic("GT7 Save Lab: reading save snapshot");
        if(storage_read(&data,&size)){diagnostic("Save Lab: read failed: %s",storage_error);error_response(fd,409,storage_error);return;}
        response(fd,200,"application/octet-stream",data,size);free(data);return;
    }
    if(!strcmp(method,"POST") && (!strcmp(url,"/api/apply")||!strcmp(url,"/api/apply-v2"))){
        int v2=!strcmp(url,"/api/apply-v2");
        if(!length || content_length<112 || (!v2&&content_length%2)){error_response(fd,400,"Invalid patch envelope");return;}
        uint8_t *body=malloc(content_length);if(!body){error_response(fd,500,"Allocation failed");return;}
        size_t got=0;
        while(got<content_length){ssize_t n=recv(fd,body+got,content_length-got,0);if(n<=0){free(body);return;}got+=(size_t)n;}
        size_t oldsize=content_length/2,newsize=oldsize,start=0;
        if(v2){
            if(memcmp(body,"G7P2",4)){free(body);error_response(fd,400,"Invalid patch magic");return;}
            oldsize=(size_t)body[4]|(size_t)body[5]<<8|(size_t)body[6]<<16|(size_t)body[7]<<24;
            newsize=(size_t)body[8]|(size_t)body[9]<<8|(size_t)body[10]<<16|(size_t)body[11]<<24;start=12;
            if(!oldsize||!newsize||oldsize>SAVE_LIMIT||newsize>SAVE_LIMIT||oldsize+newsize+12!=content_length){free(body);error_response(fd,400,"Invalid patch sizes");return;}
        }
        int ret=storage_apply_v2(body+start,oldsize,body+start+oldsize,newsize);free(body);
        if(ret){diagnostic("Save Lab: apply failed: %s",storage_error);error_response(fd,409,storage_error);return;}
        diagnostic("GT7 Save Lab: save changed successfully\nBackup verified; editor mount released");
        char escaped[2048],message[2200];json_quote(escaped,sizeof(escaped),storage_backup);
        snprintf(message,sizeof(message),"{\"ok\":true,\"backup\":\"%s\"}",escaped);
        response(fd,200,"application/json",message,strlen(message));return;
    }
    error_response(fd,404,"Unknown endpoint");
}
int main(int argc,char **argv){
    diagnostic("GT7 Save Lab 0.4.1 starting");
    const char *file=NULL,*backups=NULL;int port=8097;
    for(int i=1;i<argc;i++){
        if(!strcmp(argv[i],"--port") && i+1<argc)port=atoi(argv[++i]);
#ifndef PS5
        else if(!strcmp(argv[i],"--file") && i+1<argc)file=argv[++i];
        else if(!strcmp(argv[i],"--backups") && i+1<argc)backups=argv[++i];
#endif
        else {fprintf(stderr,"Unsupported argument: %s\n",argv[i]);return 1;}
    }
    if(port<1 || port>65535)return 1;
    storage_init(file,backups);
    diagnostic("GT7 Save Lab 0.4.1: storage initialised; preparing server");
    int random=open("/dev/urandom",O_RDONLY);uint8_t bytes[32];
    if(random<0 || read(random,bytes,sizeof(bytes))!=(ssize_t)sizeof(bytes)){diagnostic("Save Lab: random token failed: %s",strerror(errno));if(random>=0)close(random);return 1;}close(random);
    for(size_t i=0;i<sizeof(bytes);i++)snprintf(token+i*2,3,"%02x",bytes[i]);
    signal(SIGPIPE,SIG_IGN);signal(SIGINT,stop_server);signal(SIGTERM,stop_server);
    int server=socket(AF_INET,SOCK_STREAM,0);if(server<0){diagnostic("Save Lab: socket failed: %s",strerror(errno));return 1;}
    int yes=1;setsockopt(server,SOL_SOCKET,SO_REUSEADDR,&yes,sizeof(yes));
    struct sockaddr_in address={0};address.sin_family=AF_INET;address.sin_port=htons((uint16_t)port);
#ifdef PS5
    address.sin_addr.s_addr=htonl(INADDR_ANY);
#else
    address.sin_addr.s_addr=htonl(INADDR_LOOPBACK);
#endif
    if(bind(server,(struct sockaddr*)&address,sizeof(address)) || listen(server,8)){diagnostic("Save Lab: cannot listen on port %d: %s",port,strerror(errno));close(server);return 1;}
    diagnostic("GT7 Save Lab 0.4.1: listening on port %d",port);
    announce_address(port);
    /* Shortcut registration must never block the HTTP accept loop. Disabled
       until its hang on firmware 12.40 can be diagnosed independently. */
    while(!stopping){
        int client=accept(server,NULL,NULL);if(client<0){if(errno==EINTR)continue;break;}
        struct timeval timeout={10,0};setsockopt(client,SOL_SOCKET,SO_RCVTIMEO,&timeout,sizeof(timeout));setsockopt(client,SOL_SOCKET,SO_SNDTIMEO,&timeout,sizeof(timeout));
        handle(client);
        /* Send the complete error response even when rejecting a POST before
           consuming its body. Closing with unread bytes can emit TCP RST. */
        shutdown(client,SHUT_WR);
        struct timeval drain_timeout={1,0};setsockopt(client,SOL_SOCKET,SO_RCVTIMEO,&drain_timeout,sizeof(drain_timeout));
        char drain[4096];size_t drained=0;ssize_t chunk;
        while(drained<2*SAVE_LIMIT && (chunk=recv(client,drain,sizeof(drain),0))>0)drained+=(size_t)chunk;
        close(client);
    }
    diagnostic("Save Lab: server stopped%s",stopping?" by signal":" after accept error");close(server);return 0;
}
