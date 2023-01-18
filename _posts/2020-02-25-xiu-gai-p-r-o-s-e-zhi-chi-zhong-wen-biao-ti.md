---
layout: post
categories:
  - code
published: true
title: 修改 Prose 支持中文标题
description: Prose 如何支持中文
keywords: 'prose,github,heroku,pinyin'
---
## 思路

> 我的思路非常简单，找一个汉字转拼音的库解决这个 [Issue](https://github.com/prose/prose/issues/1000)

## 修改点

> 直接参见 [Commit](https://github.com/springhack/prose/commit/943283b870768efb0cda25ce39ae2dd629e79455)

```js
return pinyin.convertToPinyin(string, '-', true).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-*$/, '');
```

## 部署

> 我选择了 Heroku

1. 部署 `Prose GateKeeper`，参见文档就行
2. 部署 `Prose`，记得指定 `node` 版本，修改 `oauth.json` 然后强制提交，部署 `Heroku` 就行啦

> 这里提供下我修改的支持中文的版本：[Prose-CN-Dosk](https://prose-cn-dosk.herokuapp.com/)