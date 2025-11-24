---
layout: post
filename: jie-jue-Chrome-yuan-sheng-gu-ge-fan-yi-gong-nai-de-yi-ge-si-lu-：1/3
title: 解决 Chrome 原生谷歌翻译功能的一个思路：1/3
categories:
  - code
  - work
  - life
description: 这次先解决访问不通的问题
keywords: google, chrome, translate
---
### 基本思路

1. 本质上是 `translate.google.com` 和 `translate.googleapis.com` 访问不通了(具体哪些域名我没细看)，那么我们首先解决访问不通的问题

2. 可以找个能访问通的 `VPS` 来做反向代理，有人说我又不能申请这俩域名的证书，那么我们直接通过 `HAProxy` 做 `SNI` 代理不就好了

### 基本代码

```
global
  log 127.0.0.1 local3
  chroot /var/lib/haproxy
  pidfile /var/run/haproxy.pid
  maxconn 4000
  user haproxy
  group haproxy
  daemon

defaults
  log     global
  option  dontlognull
  option http-server-close
  option redispatch
  retries 3
  timeout http-request 10s
  timeout queue 1m
  timeout connect 10s
  timeout client 1m
  timeout server 1m
  timeout http-keep-alive 10s
  timeout check 10s
  maxconn 3000

frontend https_proxy
  mode tcp
  bind :443
  tcp-request inspect-delay 5s
  tcp-request content accept if { req_ssl_hello_type 1 }

  acl is_google_translate req_ssl_sni -i translate.google.com
  use_backend google_translate if is_google_translate

backend google_translate
  server web1 translate.google.com:443
```

### 食用方法

1. 找个 `VPS` 装 `HAProxy`，配置上述逻辑(其他域名酌情自己加)

2. 之所以本文章标题写的是 `1/3` 是因为这样做了以后，相当于物理上给 `Google` 加了个服务器，但是域名并没有解析过去，我们也没办法影响所有人的解析，所以这里暂时修改 `/etc/hosts` 实现，毕竟各种插件没法影响 `Chrome` 自己的解析

3. 修改 `/etc/hosts` 毕竟是麻烦些，不过现在起码保证了即使以后 `IP` 变化了我们也不需要更新东西

4. 预告下(挖个坑)：后面想办法把这个东西限制在 `Chrome` 应用范围内，目前我想到的办法就是写个插件，内部起个 `HTTPDNS` 服务，然后 `Chrome` 里设置使用 `http://localhost` 做解析，也许顺手还能做点别的事情，当然不差钱的老哥可以买个国内的 `VPS` 搞这件事，这样就不用写插件啥的，大家 `Chrome` 里设置一下就直接使用了 emmm...
