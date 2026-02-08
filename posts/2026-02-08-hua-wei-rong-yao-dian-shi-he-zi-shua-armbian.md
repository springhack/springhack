---
layout: post
filename: hua-wei-rong-yao-dian-shi-he-zi-shua-Armbian
title: 华为荣耀电视盒子刷 Armbian
categories:
  - code
description: 作为 klipper 上位机了
keywords: huawei, honor, m321, armbian, linux
---
### 目标

* 刷成 linux 系统，并且装 klipper 全家桶控制我的老 3d 打印机

  * 要求是 linux kernel 版本尽可能新
  * rootfs 空间要足够装 klipper 全家桶

### 步骤

1. 先刷个能用的 linux 系统，这里选用 [海纳思系统](https://www.ecoo.top/) 系统，这个系统的 linux kernel 版本比较旧但是起码能用，我采用 ttl 刷机步骤，我的 soc 是 hi3798mv100
2. 刷个高版本 linux 内核，这一步采用 [loonpn/ec6108v9c-linux-kernel](https://github.com/loonpn/ec6108v9c-linux-kernel) 的代码，我选的是 v6.14.3 版本，可以自己编译也可以使用开发者编译好的，具体步骤就是 dd 进对应分区
3. 想办法扩充 rootfs，我的解决方案是用 sdcard，具体步骤如下

* 首先是修改 hinas 里的 /sbin/init 链接指向我自己的 init，这一步在 hinas 机器里做，这个 init 的代码会在文章结尾奉上
* 然后是 rootfs 构建，这步以及后续步骤可以找台 linux 电脑搞定，我是将 [Orange Pi One](https://www.armbian.com/orange-pi-one/) 的镜像直接 dd 进 sdcard，然后挂载进去
* 然后就是添加新内核的 modules 到 rootfs 里，放进 /lib/modules 对应位置就好了
* 有一些个没什么必要但是看个人的步骤：删除 /boot 里没用的文件，以及修改 /etc/armbian-release 等文件让信息正确显示等，可做可不做

4. 然后，插回 sdcard，重启，按照正常的 armbian 初始化流程做就好了

### 优势

* linux kernel 版本足够高，很多事情处理起来方便，rootfs 里的软件更新也很方便
* 因为 hinas 里的 init 被改掉了，使用起来就像是机器引导 sdcard 的体感一致，需要更新内核只要 dd 一下就好，系统坏了就拔下 sdcard 修复就行(其实纯属是我不想改 bootargs 那坨东西)

### 弊端

* soc 温度采集没有，对我的场景来说不那么重要，我也没管
* bootargs 里有一些内核不支持的 args，不影响使用，dmesg 看着会难受点
* linux kernel 不是 armbian 提供的，所以如果需要添加内核模块很麻烦，你可以选择自己编译下这个内核再添加，我没有这个需求

### Init 源码

> 酌情修改就好，记得编译成 armhf 架构，静态编译

```c
#define _GNU_SOURCE
#include <unistd.h>
#include <sys/mount.h>
#include <sys/syscall.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>

#define NEWROOT "/newroot"
#define OLDROOT "/newroot/oldroot"
#define DEV "/dev"
#define PROC "/proc"
#define SYS "/sys"
#define RUN "/run"

static void die(const char *msg) {
    perror(msg);
    _exit(1);
}

int main(void) {
    mount("proc", PROC, "proc", 0, NULL);
    mount("sysfs", SYS, "sysfs", 0, NULL);
    mount("devtmpfs", DEV, "devtmpfs", 0, NULL);
    mount("tmpfs", RUN, "tmpfs", 0, "mode=0755");

    if (mount("/dev/mmcblk1p1", NEWROOT, "ext4", 0, NULL) != 0) die("mount newroot");
    mkdir(OLDROOT, 0755);

    if (syscall(SYS_pivot_root, NEWROOT, OLDROOT) != 0) die("pivot_root");
    if (chdir("/") != 0) die("chdir /");

    mount("/dev", DEV, NULL, MS_MOVE, NULL);
    mount("/proc", PROC, NULL, MS_MOVE, NULL);
    mount("/sys", SYS, NULL, MS_MOVE, NULL);
    mount("/run", RUN, NULL, MS_MOVE, NULL);

    umount2("/oldroot", MNT_DETACH);
    rmdir("/oldroot");

    execl("/sbin/init.real", "init", NULL);
    die("exec init failed");

    return 0;
}
```

### 图

![](/uploads/m321-armbian.png)