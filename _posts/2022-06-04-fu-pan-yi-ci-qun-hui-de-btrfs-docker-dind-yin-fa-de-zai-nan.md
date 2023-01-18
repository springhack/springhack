---
layout: post
filename: fu-pan-yi-ci-qun-hui-de-btrfs-+-docker:dind-yin-fa-de-zai-nan
title: 复盘一次群晖的 btrfs + docker:dind 引发的灾难
categories:
  - code
  - work
description: btrfs 是得好好熟悉下再使用
keywords: synology, btrfs, linux kernel, docker in docker, dind
---
### 背景

1. 我现在是主要使用 `k3s` 来管理 `homelab` 的，但是群晖的内核缺少 `cgroup v2` 和 `overlayfs` 等功能的完整支持，所以在群晖上是 `docker-compose` 为主
2. 群晖部署了三个主要的东西：`gitea` + `drone` + `drone-docker-runner`，我有个仓库会利用 `drone` 去构建 `docker image` 上传到我内网的 `registry`，按照 `drone` 的官方用法搭建了 `drone-docker-runner` 和 [dind](https://docs.drone.io/pipeline/docker/examples/services/docker_dind/)，也成功完成了想要的功能
3. 但是随后我发现群晖上多了几个自动生成的 `docker volume`，我想着删除就好了，但是发现删不掉，提示没有权限...

### 傻逼操作

> 用户组丢失

1. 首先以为是 `docker/containerd` 之类的用户组导致的问题，我不想直接动文件系统删除所以并没有确认这个事儿，就先入为主的确定就是用户组导致的，然后调用了这个命令：`sudo synogroup --member administrator docker`，但是这就是傻逼的开始，因为这个命令需要传入所有需要放到组内的 `user`，这里我写了个 `docker`，就导致 `administrator` 这个组里只有 `docker` 这一个用户，然后我还退出了 `ssh` 并重启了系统，导致我无法在任何角度登录进去...

2. 后来解决的方法很 `hack`，因为我通过 `socat` 将 `/var/run/docker.sock` 做了转发，所以我可以在内网其他机器操作群晖的 `docker`，所以我通过开启一个 `alpine` 容器并挂载 `/etc/group` 的方式来修改用户组，最后得以恢复...

> (人为)磁盘损毁

1. 这个就是噩梦的开始，简单来说我尝试各种方法去删除那个卷都不行，在不了解 `btrfs` 的前提下单方面认为这个卷已经不 `ok` 了，所以决定重建存储空间/存储池，做出这个决定是因为我的群晖不只有一个存储空间，而 `docker` 所在的空间是第一块硬盘单独划分的(群晖的特性，第一个硬盘存储系大部分统数据并优先使用)

2. 噩梦就在于，我无法删除存储空间/存储池，单方面认为文件系统已经不可逆损坏，所以又做出了更错误的决定，我要造成人为数据损毁，因为只有这样才能让系统不再持有文件系统的相关信息，所以我直接将第一块硬盘开机状态下拔除并格式化...

3. 接下来就是删除损毁的存储空间/存储池，并按照新加入硬盘的流程重建存储空间/存储池；其实只影响了套件的数据，对我重要的数据都没影响，因为都是单独划分存储空间/存储池来保存的...

### 复盘

> 我这里就直接说经过调查的真实原因了，关于 `drone dind` 的层级架构请自行研究吧

1. 群晖使用 `btrfs` 来配合 `docker` 实现 `storage driver`，并且没有 `overlayfs` 支持，所以没得选

2. 根据 `docker` 的 [官方文档](https://docs.docker.com/storage/storagedriver/btrfs-driver/#how-the-btrfs-storage-driver-works) 提到，镜像在本地其实是一个 `btrfs subvolume`，上层的所有 `layer` 都是 `snapshot`，所以在我的场景里，`drone-docker-runner` 和 `docker:dind` 镜像都是在 *宿主* 也就是群晖上的直接的 `btrfs subvolume`

3. `docker:dind` 的 `Dockerfile` 声明了 `VOLUME /var/lib/docker` 所以在运行期间会在 *宿主* 产生一个匿名卷，也就是我删不掉的卷，此时这个卷还是正常的卷，背后是 `btrfs` 文件系统

4. `pipeline` 运行时通过共享 `docker:dind` 的 `/var/run/docker.sock` 来拉取其他镜像，位置当然就在 `docker:dind` 的 `/var/lib/docker` 里面也就是宿主机的匿名卷，并且创建了 `btrfs subvolume`

5. 构建流程结束，`drone-docker-runner` 会负责清理临时镜像和容器，对于她来说只要执行了步骤就可以了，并没有关心是否真的清理干净，`docker:dind` 的 `service` 退出时也不会主动清理已经拉取的镜像(也没什么机会和理由做这件事)，所以最后造成的结果就是宿主机的一个匿名卷里面包含了一个 `btrfs subvolume`

6. 有些人可能会想明明清理了，为啥会删不掉，这里就是另一个坑了，根据文档：[Arch WiKi - Btrfs](https://wiki.archlinux.org/title/btrfs#Deleting_a_subvolume)，`btrfs` 的 `subvolume` 需要使用 `btrfs` 命令来删除，只有 `linux 4.18` 之后的版本才能够用普通的文件系统命令 `rm/rmdir` 来删除，但是巧的是群晖当前的内核版本只有 `4.4.180+  (Linux Nazi 4.4.180+ #42661 SMP Fri Apr 1 15:31:10 CST 2022 x86_64 GNU/Linux synology_v1000_1621+)`，所以并不能删除...

7. 也就是说我直接 `btrfs subvolume list -p xxxx` 再 `btrfs subvolume delete yyyy` 就能搞定的事儿绕了这么大一圈...

### 后续

1. 尝试修改构建参数，使用其他支持的非 `btrfs` 文件系统来挂载 `/var/lib/docker`，但是群晖内核支持有限所以并没有成功

2. 有人可以看出来，因为其实有删除的方法，所以就是麻烦了点，但这可能就是程序员的强迫症吧，我希望每个角色干好自己该干的事儿，不要夸职责和留尾巴，所以最后我决定干脆就拉平层级，让 `docker:latest` 映射了 *宿主* 的 `/var/run/docker.sock` 来自己写构建，这件事的哲学就是：要么让角色各司其职，要么就全部交给开发者(也就是我自己)来完全 `DIY`