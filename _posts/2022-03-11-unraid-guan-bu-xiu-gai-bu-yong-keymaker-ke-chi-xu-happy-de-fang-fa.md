---
layout: post
filename: unraid-guan-fang-ban-bu-xiu-gai-bu-yong-keymaker-ke-chi-xu-happy-de-fang-fa
title: unraid 官方版不修改不用 keymaker 可持续 happy 的方法
categories:
  - code
description: LD_PRELOAD 听说过么
keywords: unraid, keymaker, happy, offical
---
### 前言

1. 文章里的讨论仅限于技术交流，如有需要请 [**购买正版**](https://unraid.net/pricing) ！！！
2. 文章里的讨论仅限于技术交流，如有需要请 [**购买正版**](https://unraid.net/pricing) ！！
3. 文章里的讨论仅限于技术交流，如有需要请 [**购买正版**](https://unraid.net/pricing) ！
4. 请勿分发二进制！！！



### 原理

1. `emhttpd` 使用 `RSA_public_decrypt` 去解析 `BTRS.key`，里面是你的注册信息
2. 将信息写入 `var/state.ini`，这样其他人就可以拿到

### 思路

1. 为支持正版，相关操作不予公开

### 使用方法

> 注意：我在 `Slackware` 上编译的，为的是不理会那些编译环境造成的问题

1. 为支持正版，相关操作不予公开

```shell
/usr/local/sbin/emhttp &
```

替换成

```shell
// 为支持正版，相关代码不予公开
```

### 效果

> 写这份代码时，版本是 `6.9.2`，顺手测试了一下 `6.10.0-rc3` 也是能用的，就贴个图吧
>
> ![](/uploads/unraid_happy.png)

### 代码

```c
// 为支持正版，相关代码不予公开
```
