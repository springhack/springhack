---
layout: post
categories:
  - code
published: true
description: 最近挖的新坑
title: 使用 Bash Shell 构建的飞书机器人
keywords: 'lark, feishu, bash, shell, bot'
---
## 这可能是一个新的坑

> 先放一个链接 [Lark-Bot-Shell](https://github.com/springhack/lark-bot-shell)

## 功能

 - 收消息
  - 需要在开放平台开启订阅
  - 使用 bashttpd 作为 Web Server，不过采用了一个 fork 版本，并且修复了 Linux 下中文请求的问题 [bashttpd](https://github.com/springhack/bashttpd/tree/post)
  - 需要 socat 配合，起初采用 netcat，不过 macOS 的 netcat 很坑爹，既然要装外部命令，干脆用 socat 吧
  - 支持命令
 - 发消息
  - 纯文本消息
  - 回复消息，内容仅限纯文本
  - 卡片消息，硬性规定了某些内容是必须的
  
## 配置&运行

1. 首先去开放平台，获取你的 `APPID` 与 `APPSECRET`

2. 拉代码，然后新建文件 `.env` 在项目根目录，内容类似这个

```shell
APPID=xxxxxx          # AppID
APPSECRET=xxxxxx      # App Secret
SERVER_PORT=8080      # Server Port
```

3. 启动 server：`./bin/server`

4. 开放平台配置订阅地址，例如：`https://127.0.0.1:8080/challenge`

## 定制

这个只要拉下来改代码就好了 0.0