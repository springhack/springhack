---
layout: post
categories:
  - code
published: true
title: Cocoa 如何创建置于全屏之上的 NSWindow
---
## 起因

1. 本身是业务需求，其实这件事自己也需要，就是写一个截图 app

## 经过

1. 本来就是按照自己原来写截图 app 的思路移植过来嘛，但是原来的截图做法，是在 `Info.plist` 里配置了 `LSUIElement` 这个东西，新的截图 app 是附加在一个 app 内部，这个 app 有 menu 有 dock，这个方法就失效了

2. 后来去各种搜索，结果都是无疾而终，然后去看了看 electron 的代码，我感觉已经自暴自弃了：[Electron](https://github.com/electron/electron/blob/6181c03df03f298779db071315103ff5a8bd99ab/shell/browser/native_window_mac.mm#L1377)

3. 后来想了个损招，就是 `NSWindow` 出来之前，先把 app 的属性改成 `LSUIElement`，效果是 ok 的，就是窗口出来前会闪一下，emmm

```cpp
ProcessSerialNumber psn = { 0, kCurrentProcess };
TransformProcessType(&psn, kProcessTransformToUIElementApplication);
```

4. 去查了些带截图的 app，我发现只有微信做到了既有 dock，又在进程内创建 `NSWindow` 还能浮在别人之上这件事，于是我祭献出了 `Interface Inspector` 大杀器，还是有收获的，我发现微信的截图窗口是个 `non-active` 窗口，这玩意不是只有 `NSPanel` 能用么

## 结果

1. 结果就是我最后实现的是基于 `NSPanel` 做到的，只不过我们的代码基于 `Chromium` 仓库，所以还要给它去适配一下

## 代码

> 这里附上主要逻辑代码，完整工程地址参见：[Github](https://github.com/springhack/cocoa_floating_demo)

```cpp
// Create window
NSWindow* window = [[NSPanel alloc]
    initWithContentRect:frame
              styleMask:NSWindowStyleMaskTitled |
                        NSWindowStyleMaskNonactivatingPanel  // the most important mask
                backing:NSBackingStoreBuffered
                  defer:YES
                 screen:screen];

// Set window space behavior
[window setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces |
                              NSWindowCollectionBehaviorFullScreenAuxiliary];

// Set window level
[window setLevel:CGShieldingWindowLevel()];
```