---
layout: post
filename: ji-lu-yi-ge-mo-yi-yi-de-usb-wifi-qu-dong-bian-yi
title: 记录一个没意义的 usb wifi 驱动编译
categories:
  - code
description: 改了半天发现有改好的 = =
keywords: rtl8851bu, rtl8831, 0bda:b851, armbian, arm64
---
### 起因

* 买了个 usb wifi 网卡，很久之前买的了，忘记是为何而买，恰巧过年回家把老家的 `r4s` 下线了，寻思着给他用吧

### 驱动

1. 一开始 `lsusb` 看到的设备 id 是 `0bda:1a2b`，于是 `usb_modeswitch -KW -v 0bda -p 1a2b` 切换成 `wifi` 设备了，设备 id 变为 `0bda:b851`
2. 搜索得驱动源码：`https://github.com/biglinux/RTL8851bu`(坑爹的开始)
3. `Armbian` 系统，升级内核，安装 `build-essential/dkms` 和头文件，编译报错，找不到对应 arch 的 Makefile，看了下不知为何 `armbian` 用的是 `arm64`，`make` 用的 `aarch64`，我记得标准应该是 `aarch64` 才对，遂修改 `Makefile` 和 `dkms.conf`
4. 函数符号不对，`cfg80211_cac_event` 提示缺参数，内核升级的后的常见问题，遂查找头文件看 `cfg80211_cac_event` 函数原型和注释，其中 `link_fd` 注释说明可以是 `0` 所以无脑改 `0`，一共两处
5. 驱动源码里，`iface->rtw_wdev->cac_started` 找不到，说结构体上没有，遂翻内核源码看 `struct wireless_dev` 定义，发现需要从 `links[]` 里取，传入 `index` 意义是 `link_fd`，因为上面说这处可以是 `0` 遂直接写 `0` 尝试，`vim` 批量替换好
6. 编过了，`insmod` 提示缺符号，`modprobe cfg80211` 后重新加载，跑起来啦，兴奋🥰

![](/uploads/1.jpeg)

### 傻逼

- 既然跑起来了，寻思 `fork` 仓库修改一份留存，然后发现 tmd 人家有个新仓库(不看 readme 的傻逼是我 555)，`https://github.com/biglinux/rtl8831`，翻阅对应的位置看，人家已经适配好了高版本内核 2333

![](/uploads/2.jpeg)

![](/uploads/3.jpeg)