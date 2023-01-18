---
layout: post
filename: zai-NAS-li-you-ya-de-shi-yong-xun-lei
title: 在 NAS 里优雅的使用迅雷
categories:
  - code
  - life
description: 尝试多种方案，最后决定自己搞一下
keywords: 迅雷,thunder
---
### 更新

1. 从 `novnc` 换成了 `xpra`，个人感觉更快了，剪切板支持也更好了

2. 支持环境变量 `XPRA_PASSWORD` 更换密码

3. 镜像：`springhack/nas_xunlei_docker:latest` 支持 `latest` 其他的部分没区别

### 背景

> 说白了还是存在一些应用场景，某些资源还是需要迅雷

### 现存方案

1. `docker + xware`：基本凉透了
2. 虚拟机跑 `windows`：太卡太慢太吃硬件
3. 玩物下载：威联通没有官方下载(查了下，其实 `AppCenter` 里有下载，官网没有，不知道是不是因为我自己添加 `qnapclub` 的原因)，并且还有著名的偷跑流量硬盘事件；最重要的是，我特喵的试了下登陆不上(一开始我是想用它来搞个 `docker` 限制后台流量和 `io` 的)
4. 迅雷自己的 `nas` 套件：邀请阶段，而且没有威联通
5. `wine`：说白了不太想用这个，控制欲比较强，我会对每个程序的每个进程做的事知根知底，这样基本等于裸跑迅雷，兼容性也是个问题
6. `docker + lxde + nvc + novnc + baidudisk + neteasemusic + xunlei`：镜像太大，搜到的原文是这个：[bilibili](https://www.bilibili.com/s/video/BV1qN411Q7AN)

### 我的方案

1. 先调查下上述方案 5 跑的到底是个什么玩意，所以我就拉他的 `docker` 镜像，但是我本地都是在虚拟机里测试，硬盘没分够，又懒得重启改硬盘大小，Orz...
2. 突然想起了前段时间公司的产品适配 `UOS` 系统，我冥冥之中感觉他用的就是这个版本的迅雷，搜了一下图，果然是，那就开搞
3. 我一开始想装个 `USO` 虚拟机，提取他的源地址，但是我发现根本不用这么麻烦，`Arch AUR` 里有人已经帮我做了这件事，我就直接拿来主义了(反正只是为了一个地址写 `Dockerfile` 文件嘛)：[Xunlei Bin](https://aur.archlinux.org/packages/xunlei-bin/)
4. 为了不把镜像搞得特别大，所以我决定从 `ubuntu:20.04` 开始搞起，基本思路就是安装以下几个基础组件：`tightvncserver + novnc + icewm + com.xunlei.download`
5. 这里说说坑：一个是 `UOS` 的包不是适配到其他系统的 `deb` 只是借了个格式，而且还有一些很恶心的依赖，这里我的解决方法是弄个假的 `deepin-elf-verify` 包，只是为了过 `dpkg` 的依赖检查；另外就是 `electron(迅雷是基于它的不是)` 本身的依赖没有写进来，所以我在 `Dockerfile` 里写好了安装依赖的命令
6. 废话不多说，上地址，截止本文最新版本的迅雷是 `1.0.0.2`，代码写的比较偷懒(复制了好多其他人的步骤)：[springhack/nas_xunlei_docker](https://github.com/springhack/nas_xunlei_docker/blob/main/Dockerfile)

### 使用方法

- 灰常简单，你需要注意的只有两个地方：挂载的目录和端口，懂得都懂，不设置你就没法用了，命令：

```
docker run \
 --name xunlei \
 -v /shares/Public/Downloads:/root/downloads \
 -p 1234:6080 \
 springhack/nas_xunlei_docker:1.0.0.2
```

- 建议国内用户配个 `docker registry-mirrors` 不然会很慢

- 打开浏览器，输入 `http://{你的IP}:1234`，开始下载吧(`/root/downloads`)

### 存在缺点

1. 镜像体积还是很大，因为装了很多和 `GUI` 相关的东西以及依赖，后续看看能不能精简吧
2. 装了个 `icewm`，无奈之举，一开始我是不带 `icewm` 跑的，能跑，但是窗口不能移动和焦点/菜单/选择目录等各种问题让我放弃了
3. 剪切板不是那么完美，主要归咎于 `novnc`，其实可以做到完美，后续我看看能不能出个优化方案(`TODO +1`)
4. 启动稍慢(我 `sleep 5` 让他慢点启)，不过满足了我用的时候再开启的愿望，防止他后台偷偷做事情
5. 提示硬盘空间不足(`0MB`)，不过不影响使用

### 重要信息

1. 默认密码：`sksks`，`vnc` 不能设置短密码，所以我写了个工具放在 `/root/vncpwd`，可以设置任意长度密码

### 开拓思路

1. 其实这个 `Dockerfile` 简单改改(依赖/下载地址/启动路径)，就可以跑起 `UOS` 里其他的软件，可以作为基础镜像用来移植其他软件

2. 不仅是 `UOS` 软件，其他 `linux` 软件也可以直接改改用，就看你硬件吃不吃得消了(这里推荐一下我司的飞书，支持 `UOS`，可以随时随地云办公了 `lol`)

### 屏幕截图

> 我就简单放几个我的 `nas` 实机截图吧

![](/uploads/docker.png)

![](/uploads/xunlei.png)