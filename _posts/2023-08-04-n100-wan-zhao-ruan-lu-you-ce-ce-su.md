---
layout: post
filename: N100-wan-zhao-ruan-lu-you-ce-ce-su
title: N100 万兆软路由测测速
categories:
  - code
  - life
description: 当然不是宽带，用不起
keywords: n100, 82599es
---
> 书接上文 [整活新玩具，半 DIY 一个万兆软路由](/2023/08/04/zheng-huo-xin-wan-ju-ban-diy-yi-ge-wan-zhao-ruan-lu-you/)，测了个速

## 网络配置

1. `eth0` 作为 `wan` 接入我的万兆交换机，`dhcp` 协议(办不起万兆宽带T_T)，走 `DAC` 线(手头没有光纤和模块了)
2. `eth1` 作为 `lan` 使用 `AOC` 线，对端是威联通的雷电三万兆网卡，接入 `Macbook Pro`
3. 其余四个 `2.5GbE` 网口闲置，什么都没接入，所有 `MTU` 设置 `1500`，我知道需要开启巨型帧，但是受限于我的交换机设置，委屈下使用 `1500` 吧，反正数据也是仅供参考

![](/uploads/20230804-153355.jpeg)

## 系统 PCI 输出

> 如果所说，协商 `5GT/s x4`，是降级了的

![](/uploads/20230804-153130.jpeg)

![](/uploads/20230804-153134.jpeg)

## 测速及负载

![](/uploads/20230804-153139.jpeg)

![](/uploads/20230804-153143.jpeg)

## 总结

- 反正达到我的预期了，玩的开心，参考[这位大哥](https://www.zhihu.com/question/393916816/answer/2513205412)，似乎上传小了点，不过基本也够玩了