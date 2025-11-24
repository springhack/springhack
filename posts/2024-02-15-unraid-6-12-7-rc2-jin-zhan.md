---
layout: post
filename: unRAID-6.12.7-rc2-jin-zhan
title: unRAID 6.12.7-rc2 进展
categories:
  - code
description: 是我一直担心的静态链接
keywords: unraid, unraider, 6.12.7-rc2, happy, 开心版
---
### 长话短说

1. `openssl` 静态链接，所以最基础的 `hook` 函数的方法不可持续了，只能回到了和毛子一样的老路上
2. 把 `unraider` 改成了动态 `keymaker`，每次启动随机生成 `RSA keypairs` 和 `BTRS.key`
3. 黑名单逻辑要改，验证 `GUID` 倒是没什么，最后会验证下 `RSA modulus` 的 `SHA1`

### 看图说话

![](/uploads/20240216-015218.jpeg)

![](/uploads/123.jpeg)

![](/uploads/adasdad.jpeg)

![](/uploads/20240216-015652.jpeg)