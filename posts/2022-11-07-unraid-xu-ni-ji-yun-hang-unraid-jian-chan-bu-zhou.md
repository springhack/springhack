---
layout: post
filename: unRAID-xu-ni-ji-yun-hang-unRAID-jian-chan-bu-zhou
title: unRAID 虚拟机运行 unRAID 简单步骤
categories:
  - code
  - life
description: 套娃
keywords: unraid, vm
---
### 步骤

1. 新建个 `Ubuntu` 的虚拟机，至于原因，`unRAID` 环境折腾太麻烦了

2. 虚拟机安装好后，新增磁盘，总线选择 `USB`，然后开机，大小我分了 `10G`

3. 给这个虚拟优盘分区+格式化，也就是 `fdisk/mkfs.vfat/fatlabel` 三个命令，分区名记得是 `UNRAID`

4. 把这个分区给挂载了，下载官方系统解压进去，此时俩选择：

  - 想要 `EFI` 启动的，直接把 `EFI-` 文件夹改名 `EFI` 就好了

  - 传统启动，就复制 `make_bootable_linux` 出来，按照官方方法搞就行了

5. 这个 `Ubuntu` 虚拟机就没啥用了，下一步创建个 `unRAID` 虚拟机，用这个 `USB` 磁盘启动(最新版 `unRAID` 可以直接选择 `Enable USB boot`)

  - 当然，这一步你也可以直接把 `Ubuntu` 虚拟机用 `USB` 启动接着用

6. Enjoy~
