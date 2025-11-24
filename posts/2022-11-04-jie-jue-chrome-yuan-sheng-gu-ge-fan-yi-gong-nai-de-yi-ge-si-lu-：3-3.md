---
layout: post
filename: jie-jue-Chrome-yuan-sheng-gu-ge-fan-yi-gong-nai-de-yi-ge-si-lu-：3/3
title: 解决 Chrome 原生谷歌翻译功能的一个思路：3/3
categories:
  - code
  - life
  - work
description: 一步到位+白嫖解决
keywords: google, translate
---
### 接上文

> 方案：测试了一波，只有 `DoH` 会靠谱些，找了一圈找到了华为云函数，可以白嫖

1. 注册华为云，新建云函数，默认 `Nodejs` 的就行，触发器选择 `HTTP`，名字很重要一定要叫 `dns-query` 因为我懒得改配置

2. 里面跑 `dnsmasq` 并配置你写死的解析记录，`translate.google.com` 和 `translate.googleapis.com` 两个域名都要，上一篇文章里只演示了前者，也要对应加上

3. 启动 `doh-proxy` 代理 `dnsmasq` 来解析

4. 华为云，增加触发器，验证关闭(任何人都可访问)，然后把地址复制到 `Chrome` 的设置里`(Privacy and security -> Security -> Use secure DNS)`，选择 `Custom` 填入地址

5. 打开翻译功能，愉快的使用吧(可以在 `chrome://net-internals/?#dns` 里验证是否解析成功)

### 代码

> `dnsmasq` 的配置，地址改你自己的

```
port=5353

domain-needed

strict-order

cache-size=1024

address=/translate.google.com/123.123.123.123
address=/translate.googleapis.com/123.123.123.123
```

> `bootstrap` 也就是华为云函数的启动文件代码

```
#!/bin/bash

## current dir
cd $RUNTIME_CODE_ROOT

## start dnsmasq
./dnsmasq --conf-file=./dns.txt

## start doh-proxy
./doh-proxy --listen-address 0.0.0.0:8000 --server-address 127.0.0.1:5353
```

> 其余二进制文件，我放网盘里了，可以直接在华为云上传，然后在线修改地址之类的

[夸克网盘 code.zip 链接](https://pan.quark.cn/s/63fb14a4315c)