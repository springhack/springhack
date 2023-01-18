---
layout: page
title: About
description: Full stack engineer POI~
keywords: SpringHack
comments: true
menu: 关于
permalink: /about/
published: true
---

## 谁啊

> SpringHack，2007年开始写代码，野生软件攻城狮一枚(误入C++歧途的全干工程师好迷啊 -。-)；

> SAU CS Software Engineering；

> 帝都北漂，说起来很是艰辛；

> 梦想成为一个小小的全栈；

> 技能点的话:
  - Kubernetes/Golang/HomeLab
  - C/C++/ObjC:
    - Because Google Chromium
    - Basic client architecture
  - Web前端向:
    - React + MobX + ES.Next(因为我是会跟随最新特性那种人) + 各种算法&结合引擎(特指V8吧)特点的性能优化
    - Electron 深入研究党，开发了诸多 enhance 模块，深入解决了很多 bug，然后，结合业务改进了进程模型等
    - Webpack 党，从零搭建了自己专属脚手架，跟随最新特性(Tree Shaking, System.import 等)
    - 比较喜欢新的、不熟悉的东西，喜欢源码角度分析，喜欢多角度测试新特性
    - 因为比较细致的分析过很多东西的源码, 对其他框架的掌握是很快的
    - CSS3 在后面因为最熟练的是 JS, CSS3 做动画没什么问题
    - HTML5 站在语义化和新特性的角度去使用了，放在最后
  - Web后端向
    - PHP (版本 5.4 - 7, 之前有外包经验)
    - Python (主要是 2.7 版本)
    - Node.js (喜欢新特性，unstable 追随者)
    - Java Servlet (无框架，只因为高中时经常写 Java)
  - 服务器方向
    - Linux, MySQL, Nginx搞负载均衡, 基础网络调整等
  - 客户端方向
    - Android (应用, 底层, Weex等)开发, Windows 开发 (C, C++, C#), macOS应用 & 内核模块开发(IOKit那一套), Linux开发
  - 算法方向
    - NOIP 二等奖渣渣; ACM 国家邀请赛三等奖渣渣, 亚洲区打酱油一次
  - 美术功底
    - 这个就当娱乐吧, 国画, 满级, 对美有自己的独特理解

> 学杂了 - -


Email: springhack#live•cn

## 啥啊

> 大部分都失效了，留作存档，做过的好玩的东西，不限于前端，但是都是我擅长的领域：

#### 沈阳航空航天大学 ACM/ICPC Online Judge && Virtual Judge 系统：
> 从前端到后端再到评测进程和爬虫进程完全自己写的，PHP7 + Python，使用 Linux 内核相关技术实现评测安全管理(和hustoj思路一致) - -
> 猛戳：https://www.acmor.cn/


#### CodeFly － 一个简洁的代码分享 & 运行平台(停止运行，代码在Github)：
> React 全家桶系列，也是完全自己写的全部细节，包括动画的每一个细节，后端核心是 Node.js + Python 写的，承接自上面的核心 - -
> 猛戳：https://acmor.cn:3070/


#### Five UI － 自用React.js组件库，开发中：
> 没事自己做的，为了方便自己以后的开发咯，顺便用于实践，进展比较缓慢 －－
> 猛戳：https://github.com/springhack/Five-UI


#### boot2env － 前端 React 项目脚手架，支持 SSR 和 Tree Shaking 等，持续更新：
> 方便自己写项目的和加深理解模块化，所有细节都是自己实现的，所有项目都是基于这个脚手架 －－
> 猛戳：https://github.com/springhack/boot2env


#### 新番更新表：
> 也是没事自己做的，比较方便，实时算法进行拼音(支持多音字)检索 - -
> React 技术栈 + Express 后端 + 爬虫，语言全部 ES.next ，不过Flux方面我用的是我自己造的轮子: Alux(详见博文) －－
> 猛戳：https://github.com/springhack/NewAnime


#### Android 平台移动端IDE: Android OIDE
> 虽然我对外停止更新了，但是它曾经撑起了一片高中生对 NOIP(信息学竞赛，类似 ACM/ICPC 以算法为主的竞赛) 训练的需求 - -
> 它是记忆，估计现在仍然能够在网络上找到它 - -
> 猛戳：https://github.com/springhack/Android_OIDE


#### Electron 聊天工具练手：
> 其实这是我的面试题，比较方便，Node.js + React.js 写的，Node 上用了 ES.next 语法，不过近来图灵的接口很会说脏话 －－
> 猛戳：https://github.com/springhack/React-Electron-Chat


#### Web SSH Client：
> 这个是改造自其他项目，目标是为了方便自己连接 VPS，增加了密钥连接支持，有机会搞成阿里 DMS 那种规模的 - -
> 猛戳：https://github.com/springhack/WSSSH


#### JetBrains 全家桶激活服务器(已被官方ban)：
> 这个比较，嗯，逆向出来的，代码只有原理没有核心数据，这最起码的底限我还是有的 - -
> 猛戳：https://github.com/springhack/JetBrains-License-Server


###### 其余的好玩的东西没怎么放在公网上－－

## 嘎哈啊

> 创过业(外包2333)，也摆过地摊，梦想还是有的
> 大学期间负责过社团也进过学生会最后还是喜欢技术
> 奖学金也拿过几千，证书也有过不少，不过我现在就想专心的研究技术
> 可能当下我的技术不是最强的，不过我一定是那个最要强的 -。-


## 联系

{% for website in site.data.social %}
* {{ website.sitename }}：[@{{ website.name }}]({{ website.url }})
{% endfor %}

## Skill Keywords

{% for category in site.data.skills %}
### {{ category.name }}
<div class="btn-inline">
{% for keyword in category.keywords %}
<button class="btn btn-outline" type="button">{{ keyword }}</button>
{% endfor %}
</div>
{% endfor %}
