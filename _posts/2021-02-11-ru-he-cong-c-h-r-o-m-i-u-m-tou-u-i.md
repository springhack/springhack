---
layout: post
categories:
  - code
published: true
title: 如何从 Chromium “偷” UI
description: 基于 Chromium 的跨进程渲染实现
---
### 背景

- 产品是基于 `Chromium` 代码库，希望能够将 `Chromium` 与 `UI` 部分进程分离开

### 调研

> 这部分调研的流程非常冗长，所以只精简概述

1. `Windows` 下很明显非常简单，`SetParent` 就能简单的解决这个事情

2. `macOS` 下，一开始想和 `Windows` 一样，直接跨进程操作 `NSView`，事实证明这个想法有点蠢

3. 研究苹果公开的一些资料，查到了 `IOSurface` 这个家伙，不过并没有找到直接能用的东西

4. 回头找到一个 `CARemoteLayer` 的 [demo](https://www.douban.com/note/498160048/)，跑了一下是 ok 的，于是结合 `Chromium` 代码库去搜索，查到了一些端倪([CodeSearch](https://source.chromium.org/chromium/chromium/src/+/master:ui/base/cocoa/remote_layer_api.h;l=1?q=ui%2Fbase%2Fcocoa%2Fremote&sq=))

5. 在代码里也看到使用 `IOSurface` 的方法，果然 `Google` 的代码能够让人进步啊

### 实践

1. 先使用比较裸奔的方法，看懂了 `demo` 之后，直接魔改了 `gpu` 部分的代码，打日志将 `contextId` 打出来

2. 魔改下 `demo` 的代码，将 `ipc_read(&contextid)` 的逻辑直接写死赋值，并注释掉 `ClientMain` 的逻辑

3. 运行，测试，一切顺利的跑起来了

### 问题

1. 测试了确实能够实现远程渲染，但是只是通过 `gpu` 渲染的 `OpenGL` 部分，浏览器本身还有很多原生的元素(`menu` 和系统输入法等)

2. 解决方案也很简单，查了下 `//third_party/blink` 下的逻辑，发现其实主要是 `<select>` 和 `context_menu` 两部分，好在 `Chromium` 都有很好的将逻辑通过 `mojo` 发送到 `browser` 里实现，所以理论上只要通过 `ipc` 转发出来并实现，再屏蔽掉默认的逻辑即可

3. 输入法是个大坑，其实一直以来都有好奇，包括不限于浏览器渲染，或者游戏这种通过自己的逻辑渲染出来的画面，是如何让系统输入法很好的识别到哪个区域需要文本输入的，查了下苹果的文档，找到了这么个东西 [NSTextContent](https://developer.apple.com/documentation/appkit/nstextcontent)

4. 剩下的就好办了，查了下代码里使用到这个 `protocol` 的地方；但是，彻底把我绕晕了

5. 于是换个思路，还是从 `blink` 里查起，查到了 `EditContext` 这么个概念，顺着代码缕一遍，最后落实到 `OnUpdateTextInputStateCalled` 这个方法上

### 扩展

> 这件事能做出来啥很牛逼的事情呢

1. 想象一下，如果一个产品基于 `Chromium` 但是又想有完整的浏览器体验，又想稳定性极佳，通过这种跨进程渲染的方式是不是稳定性飙升

2. 再扩展一下，如果想在 `macOS` 下支持 `IE` 的 `ocx` 控件(呐，天朝网银大环境)，怎么实现

  a. 跑一个 `wine`，它是通过 `QuartzX` 渲染的
  
  b. 画面桥接过来
  
  c. 当然你也可以直接在程序内实现一个 `X Window Server` 啦，不一定非要这么玩

### 总结

1. 文章只是记录了这件事的调查流程，包括不限于代码/截图因为产品原因是不会放出来的

2. 是不是以后可以随便扣游戏画面了

