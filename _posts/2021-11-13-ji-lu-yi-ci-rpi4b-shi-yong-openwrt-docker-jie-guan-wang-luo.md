---
layout: post
filename: ji-lu-yi-ci-rpi4b-shi-yong-openwrt-docker-jie-guan-wang-luo
title: 记录一次 rpi4b 使用 openwrt docker 接管网络
categories:
  - code
  - life
description: 也算是对网络基础知识的一个复习
keywords: rpi4b
---
### 背景

> 树莓派 4b 闲置了，想要利用起来，搭建个软路由不错，不过还想充分压榨下硬件，搭建个 `jellyfin` 之类的，就需要保证视频硬件加速(8g 内存也不能浪费)，所以开始了折腾
>
> Docker: [springhack/openwrt-docker](https://hub.docker.com/repository/docker/springhack/openwrt-docker)

1. 只能用 32bit 系统(64bit 的硬件加速都不太正常)
2. 利用起来内置无线网卡(不想花钱)
3. 能搭建 docker 环境(跑 `jellyfin` 方便)

### 步骤

> 经过自己层层挑战之后提炼出来的，如果你有兴趣过程，可以看后半部分
>
> 此方法利用 ethernet 作为 wan 接入(我插在我的入户路由器，走 DHCP)，wireless 作为 ap
>
> 注意：受限于 rpi4b 很沙雕的 country code 行为，这个 docker 里的 ap 只有 20m 带宽，你可以自行研究研究如何修改，如果后面我改好了也会更新

1. 系统：`raspios_lite_armhf bullseye`，截止此文的最新版本
2. 启动后 `raspi-config` 自行设置一下 `locale/keyboard` 之类，老生常谈，不提了
3. 安装 docker：`curl -fsSL https://get.docker.io | sudo bash -E -`，再把自己加入到 `docker group` 里
4. 拉我最后配好的镜像：`docker pull springhack/openwrt-docker:eth0_wlan0_ap`


- 最重要两步之一，关闭一部分系统服务，为的是让 openwrt 完全接管网络：

  - DHCP：`sudo systemctl stop dhcpcd && sudo systemctl disable dhcpcd`

  - WPA：`sudo systemctl stop wpa_supplicant && sudo systemctl disable wpa_supplicant`

  - 修改配置文件：`/etc/dhcpcd.conf` 里后面加上一行 `nohook wpa_supplicant`

  - 重启系统，其实不是必要，就是觉得需要这么做，其实到此为止需要联网的操作也都做完了

- 最重要两步之二：启动我们的 `docker`

  - RUN：`docker run --detach --privileged --name openwrt --network host --restat always springhack/openwrt-docker:eth0_wlan0_ap /sbin/init`

  - CONFIG：如果你像我一样使用 `lite` 系统没有安装 `desktop` 环境，你会发现终端会输出 `openwrt` 的 `log`，基本无法操作，这是受限于 `openwrt` 的 `/sbin/init` 直接操作 `io` 导致的，我的建议是切换到 `tty2` 等其他的 `tty` 再操作；而且，重启之后也是一样的问题，所以习惯 `tty2` 成为了肌肉记忆


6. 到此为止，你得 `openwrt` 已经搭建好了，`ifconfig` 看下 `ip` 就能操作了，这里建议是关掉 `oprnwrt` 的 `dropbear` 转而使用 `raspios_lite` 的内置 `ssh` 服务
7. 啊，对了，`openwrt` 的账号密码是 `root:sksks`，`wifi` 热点是 `Alxw:11060067`，`lcui web` 默认开启 `80` 端口，你可以自由操作，不过建议慎重操作 `radio0` 因为基本一动就挂

### 技术配置

1. TODO(springhack): 留个坑，太坑了，不一定填