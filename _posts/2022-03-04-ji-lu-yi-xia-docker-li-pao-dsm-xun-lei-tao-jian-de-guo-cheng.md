---
layout: post
filename: ji-lu-yi-xia-docker-li-pao-dsm-xun-lei-tao-jian-de-guo-cheng
title: 记录一下 docker 里跑 dsm 迅雷套件的过程
categories:
  - code
description: 为了玩
keywords: chroot, proot, hook64, tmp
---
> 首先放几个地址：

> [Proot 版本 Docker](https://hub.docker.com/repository/docker/springhack/xunlei_cgi)

> [TMP 版本 Docker](https://hub.docker.com/repository/docker/springhack/thunder)

> [Github 地址](https://github.com/Infinity-Server/docker_image_set/)

### 经历

1. 先是尝试直接拷贝过来跑，linux 下能出来 web 界面，但是不可用

2. 搜索一些关键字，找到这位老哥的项目 [xunlei](https://github.com/cnk3x/xunlei)，经过测试完美跑起来，遂想到封装 docker，扣了下关键的 `cgi` 部分，写了 `Dockerfile` 跑

3. 发现问题，检测到是 `docker` 环境后，就按照白金VIP逻辑走，但是我并不是白金VIP，遂功能有 bug，开始调试，发现检测的是 `/.dockerenv` 文件，修改启动时删掉，还是不行，会检测 `/proc/self/mounts`，如果 `/` 挂载的是 `overlayfs` 就认为是 `docker`

4. `index.cgi` 是个静态编译的文件，不方便 `hook` 逻辑，遂想到 `chroot`，跑起来完美，但是创建容器需要增加 `SYS_ADMIN` 权限，强迫症开始了探索

5. 想到可以用 `proot` 不带 `root` 权限跑，最后成功跑起来，不过有两个注意点：不能挂载 `/proc` 因为是完整映射了外面的挂载；创建容器需要带 `SYS_PTRACE` 因为 `proot` 基于这个实现

6. 想到其他的方式，比如 `qemu` 跑，可以结合 `proot` 一起用，但是感觉性能会受损(我在 `rpi4b` 上部署)

7. 无奈想干脆就 `SYS_PTRACE` 算了，但是不能挂 `/proc` 感觉很心塞，所以开始写一个简单的 `ptrace` 程序来修改 `/proc/self/mounts` 的行为，然而最后发现某些场景没跑通，就暂时搁置了

8. 修改二进制，改 `mounts` 为 `status` 这样就检测不出 `overlayfs` 了，发现有二进制校验，放弃

9. `IDA64` 开始逆向，发现其有一部分 `debug` 逻辑，即运行在 `/tmp/go-build` 文件夹下会不走二进制校验逻辑，开熏，现在的线上版就是这个

### 后续

1. 有一些逻辑上可行但没有验证过的思路：同时修改他的内置 `rsa key` 来绕过签名校验

2. 经过某位群友测试，`unraid` 可以在步骤 `3` 就完美跑起来，发现 `unraid` 默认走的是 `btrfs`，经查 `docker` 可以修改 `storage-driver` 为 `btrfs` 就可以完美绕过，不过强迫症不想改默认设置

3. 经查，开发时的测试版本 `2.2.3` 在测试的时候 `proot` 是完美的，但是最近会强制校验签名，校验过程会读取 `/proc/self/exe` 所以 `proot` 方式失效，猜测是服务端控制强制开启之类，后续可以看下 `hook64` 完善之后去解决这个问题，不过我没啥动力，毕竟现在最新的 `2.3.3` 版本用 `tmp` 方式仍可完美运行，不过截止本文，`arm64` 版本的 `2.3.3` 还没出来