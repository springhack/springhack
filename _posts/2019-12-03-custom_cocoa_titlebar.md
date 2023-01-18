---
layout: post
categories:
  - code
published: true
description: 记录下魔改 Titlebar 的结果
keywords: 'cocoa, macOS, titlebar'
title: Cocoa 修改 TitleBar 样式
---
### 背景

 - Electron 产品，使用 Web 画的假的 Traffic Button，然后没有 SplitView 支持

### 实现

 - 基于 Node 模块(已有模块，使用 Nan 封装)
 - 添加 `mapTrafficButton` 方法，参数是 Electron `BrowserWindow` handle (通过 `getNativeWindowHandle`)
 - js 内调用: `native.mapTrafficButton(mainWindow.getNativeWindowHandle())`
 - BrowserWindow 设置 `titleBarStyle: 'hiddenInset'`
 
### 代码

> 还是老规矩，直接放代码

```cpp
// Method define
NAN_METHOD(MapTrafficButton) {
  void* buffer = node::Buffer::Data(info[0]->ToObject());
  if (!buffer) {
    ThrowError("MapTrafficButton invalid buffer handle !");
    return;
  }
  unsigned long handle = *reinterpret_cast<unsigned long *>(buffer);
  NSView* view = (NSView *)handle;
  // NSWindow handle
  NSWindow* win = [view window];
  // Traffic button handle
  NSButton* closeButton = [win standardWindowButton:NSWindowCloseButton];
  NSButton* minButton = [win standardWindowButton:NSWindowMiniaturizeButton];
  NSButton* zoomButton = [win standardWindowButton:NSWindowZoomButton];
  // TitleBar handle
  NSView* titlebarView = closeButton.superview;
  // Make NSWindow titlebar hight from 22 to 38
  NSToolbar* toolbar = [[NSToolbar alloc] initWithIdentifier:@"window-titlebar"];
  toolbar.showsBaselineSeparator = NO;
  [win setTitleVisibility:NSWindowTitleHidden];
  [win setToolbar:toolbar];
  // Traffic layout
  closeButton.translatesAutoresizingMaskIntoConstraints = NO;
  [titlebarView addConstraints:@[
    [NSLayoutConstraint constraintWithItem:closeButton attribute:NSLayoutAttributeTop relatedBy:NSLayoutRelationEqual toItem:titlebarView attribute:NSLayoutAttributeTop multiplier:1 constant:15],
    [NSLayoutConstraint constraintWithItem:closeButton attribute:NSLayoutAttributeLeft relatedBy:NSLayoutRelationEqual toItem:titlebarView attribute:NSLayoutAttributeLeft multiplier:1 constant:6]
  ]];
  minButton.translatesAutoresizingMaskIntoConstraints = NO;
  [titlebarView addConstraints:@[
    [NSLayoutConstraint constraintWithItem:minButton attribute:NSLayoutAttributeTop relatedBy:NSLayoutRelationEqual toItem:titlebarView attribute:NSLayoutAttributeTop multiplier:1 constant:15],
    [NSLayoutConstraint constraintWithItem:minButton attribute:NSLayoutAttributeLeft relatedBy:NSLayoutRelationEqual toItem:titlebarView attribute:NSLayoutAttributeLeft multiplier:1 constant:23]
  ]];
  zoomButton.translatesAutoresizingMaskIntoConstraints = NO;
  [titlebarView addConstraints:@[
    [NSLayoutConstraint constraintWithItem:zoomButton attribute:NSLayoutAttributeTop relatedBy:NSLayoutRelationEqual toItem:titlebarView attribute:NSLayoutAttributeTop multiplier:1 constant:15],
    [NSLayoutConstraint constraintWithItem:zoomButton attribute:NSLayoutAttributeLeft relatedBy:NSLayoutRelationEqual toItem:titlebarView attribute:NSLayoutAttributeLeft multiplier:1 constant:40]
  ]];
}

// Export method
Set(target, New<v8::String>("mapTrafficButton").ToLocalChecked(), New<v8::FunctionTemplate>(MapTrafficButton)->GetFunction());
```
