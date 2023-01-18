       macOS开启nfs给虚拟机环境完整步骤 - Dosk技术站   

[← Home](/) [About](/about/) [Archives](/archives/) [Subscribe](/atom.xml)

macOS开启nfs给虚拟机环境完整步骤
====================

Dec 14 2016
-----------

> 其实步骤很简单，但是网上的答案大部分不完整。

> 编辑 /etc/exports ，格式类似下面，前面是共享路径，后面是映射的用户，可以多条：  
> 
> 1  
> 
> /Users/SpringHack/Public    -mapall=501:20  

> 编辑 /etc/nfs.conf ，结尾添加这句：  
> 
> 1  
> 
> nfs.server.mount.require\_resv\_port = 0  

> 三条命令，前两条分别是启用和刷新配置，最后一条是显示配置信息：  
> 
> 1  
> 2  
> 3  
> 
> sudo nfsd enable  
> sudo nfsd update  
> showmount -e  

> 之后在虚拟机下就能连接了：  
> 
> 1  
> 
> mount -t nfs -o rw 10.0.2.2:/Users/SpringHack/Public /opt