---
layout: post
filename: ji-lu-xia-openwrt-gai-jiao-huan-ji-de-bu-zhou-，-yi-ji-zhu-yi-shi-xiang
title: 记录下 openwrt 改交换机的步骤，以及注意事项
categories:
  - code
description: 穷人版管理型交换机
keywords: openwrt, switch
---


### 目标

1. `openwrt` 设备的所有接口都可以使用，网上有种最简单的方式就是把所有 `lan` 口都 `unmanaged` 这个我是不能接受的，`wan` 就被浪费了
2. `openwrt` 设备本身具有 `ip` 地址，能够进行管理操作

### 步骤

1. 删除 `wan`/`wan6` 设备，目的是让原来的 `wan` 口不再默认 `dhcp client` 行为
2. 修改 `lan` 口为 `unmanaged`，并且将原来 `wan` 口的设备勾选上，我这里设备是 `eth0.2`；这里有个注意事项，有些 `diy` 的路由具有两块网卡，`wan`/`lan` 各自占用一个，这种情况下 `lan` 可能是没有网桥的，所以记得 `bridge interfaces` 要是勾选状态，因为无论如何你需要把 `wan`/`lan` 放在一个虚拟交换机下面，所以需要桥接
3. 增加一个接口，名字随意，协议选择 `dhcp client`，设备选择 `@lan` 也就是不产生设备，只是一个 `lan` 口的别名，这个设置的意义是让 `lan` 设备(通常名称为 `br-lan` 设备)获取一个 `ip` 用于管理
4. 上述操作确认之后，就可以应用了，因为网络会立刻断开，所以这里多等一会确保生效

### 效果

- 我的 `nas` 里搭建了一个虚拟交换机来模拟上级路由连接到 `openwrt` 的 `wan` 口，其实已经不能算是 `wan` 口了，应该叫 `uplink` 口(其实无所谓哪个口都行)，`lan` 口连接我的 `macbook`，然后我的 `macbook` 顺利的获取到了一个 `ip`，正是 `nas` 下发的

![](/uploads/macbook.png)

- 然后登陆 `nas` 的控制台，看到 `openwrt` 的 `ip` 地址

![](/uploads/dhcp.png)

- 登陆 `openwrt` 查看接口，嗯，和预期里一致

![](/uploads/openwrt.png)

- 也登录了下 `openwrt` 的 `ssh` 看了下，也是符合预期

![](/uploads/terminal.png)

### 后续

- 是不是把 `wifi` 开启了，也算个 `ap` 了，其实我是想当交换机用的，`wifi` 也就图一乐，真动真格的还得是有线