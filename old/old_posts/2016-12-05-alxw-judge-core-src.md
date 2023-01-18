       新的oj核心，用C写的 - Dosk技术站   

[← Home](/) [About](/about/) [Archives](/archives/) [Subscribe](/atom.xml)

新的oj核心，用C写的
===========

Dec 05 2016
-----------

> 最近实在是无聊至极，于是开始了我的oj核心重写计划。  
> 简单来说，原来是用python写的，结合了Lo-runner这个库；不过鉴于后来我改写了不少，而且python的内存效率实在是让人捉急，于是开始了改写计划。

### [](#文件结构 "文件结构")文件结构

1  
2  
3  
4  
5  
6  
7  
8  
9  
10  
11  
12  
13  
14  
15  
16  
17  
18  

springhack@Dosk:~/alxw\_judge\_core\_src$ tree  
.  
├── calls.py  
├── Makefile  
├── README.md  
└── src  
 ├── access.c  
 ├── cjson  
 │   ├── cJSON.c  
 │   └── cJSON.h  
 ├── config.h  
 ├── limit.c  
 ├── main.c  
 ├── proc.c  
 ├── run.c  
 └── socket.c  
  
2 directories, 12 files  

### [](#执行流程 "执行流程")执行流程

> 入口点是 main.c ，里面进行了两方面的初始化。首先 initcall(); 是用来初始化系统调用白名单的，白名单来自hustoj。函数的实现在文件 config.h 里面。  
> 其次 init\_socket(argv\[1\]); 用来初始化 socket ，因为评测进程是和任务的逻辑独立的，IPC使用unix domain socket。  
> socket.c 里面有具体实现，不过核心是在 run.c 这个文件里面。其实无非是照扒原来的代码，美其名曰重构－－

### [](#核心点 "核心点")核心点

> 其实还是那几个，用 ptrace 追踪系统调用，设置资源限制等。  
> 不过这次有两点不同： 1.是三个默认设备文件，这次偷懒直接用 freopen 来实现了－－ 2.这次的内存检测方案，是按照 zoj 的方案(java的不是，好虐心)的方案。  
> 目前来看，还是比较准确和稳定的。

### [](#部署 "部署")部署

> 其实这个部署还是比较简单的，原本的安装脚本，里面稍微加一句话就OK，就是切换 alxw\_judge\_core 的 Install.sh 的分支。简单的：  
> 
> 1  
> 
> git checkout c\_runner  

> 科科－－

### [](#结语 "结语")结语

> 我比较懒。。。不过今年我们的校赛应该是会用这个系统没跑了－－