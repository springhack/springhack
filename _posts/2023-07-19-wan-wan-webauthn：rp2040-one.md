---
layout: post
filename: wan-wan-WebAuthn：RP2040-One
title: 玩玩 WebAuthn：RP2040 One
categories:
  - code
description: 用 picokeys 来替代 yubikey
keywords: rp2040, webauthn
---
## 起因

* 本来是想，如何更加安全的在外登陆家庭内网，除了对自己的设备安装证书之外，有没有临时的授权某些机器的方案，随想到之前关注 `WebAuthn` 的事情
* 一番搜索下来，搜到了这个：[Pico FIDO](https://www.picokeys.com/pico-fido/)，本来我手里也有一块 `Pico` 所以就测试了一波，感觉是个不错的东西

## 我的玩法

* 一个专门的登陆页面，用来做 `WebAuthn` 的鉴权，然后给个 `cookie` 来临时登陆内网
* 硬件要随身携带，所以我买了这个：`RP2040 One`，微雪家的感觉很适合干这个事儿

## 图

> 这里就放一个图吧，因为硬件并不是最重要的部分，写代码做鉴权才是麻烦事儿

![](/uploads/20230719-160625.jpeg)