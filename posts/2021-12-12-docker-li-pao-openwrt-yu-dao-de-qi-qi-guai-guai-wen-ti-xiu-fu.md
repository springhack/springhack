---
layout: post
filename: docker-li-pao-openwrt-yu-dao-de-qi-qi-guai-guai-wen-ti-xiu-fu
title: docker 里跑 openwrt 遇到的奇奇怪怪问题修复
categories:
  - code
description: 建立在 --network=host 基础上，持续更新
keywords: docker, openwrt
---
- `wifi` 无法上网
  - `/etc/sysctl.conf` 添加 `net.ipv4.ip_forward = 1`，起因就是转发没启用

- `docker` 容器无法联网
  - `/etc/sysctl.conf` 添加如下几行，让网桥流量经过 `iptables`，可以用这个检测：`docker run --rm busybox ping baidu.com`

```config
net.bridge.bridge-nf-call-ip6tables=1
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-arptables=1
```

