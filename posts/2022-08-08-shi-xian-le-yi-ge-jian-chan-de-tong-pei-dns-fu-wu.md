---
layout: post
filename: shi-xian-le-yi-ge-jian-chan-de-tong-pei-DNS-fu-wu
title: 实现了一个简单的通配 DNS 服务
categories:
  - code
description: 一个通用的通配 dns 服务，能够兼容 sslip.io/nip.io 并且支持 acme.sh 申请 ssl 证书
keywords: dns, sslip, nip, sslip.io, nip.io, dosk_dns
---
### URL

> 地址在这，先放上来 [infinity-server/dosk_dns](https://github.com/Infinity-Server/dosk_dns)

> 不过先说好，就是个玩具，有其他需求或 `bug` 自己酌情修改或者提 `pr` 给我

### What

简单来说，就是一个兼容 [sslip.io](https://sslip.io) 和 [nip.io](https://nip.io/) 的 `dns` 服务，这俩东西还是很有用的，但是一方面申请 `ssl` 证书比较局限，二来也是自己比较感兴趣可以学习学习，就手撕了一个实现

### How

- 无非就是根据域名信息去解出来 `IPv4/IPv6` 的地址并返回

- 有个坑，双栈一些场景会优先走 `IPv6(AAAA)` 但是可能地址只能解出来 `IPv4` 比如 `127-0-0-1.xxx.yyy`，这样就需要返回 `SOA` 记录，那么客户端就会走 `IPv4(A)` 记录

- `CAA` 记录很重要，因为这是申请证书的时候一些 `CA` 回去验证的，代码里我就写死了几个

### 使用方法

1. 找个公网服务器搭建起来这玩意(或者找别人/朋友搭好的，因为需要得到授权信息)，`npm install && node dns.js`，输出的选项里的东西都是可以自己改的(比如 `--dnsAddress '127.0.0.1'` 就能改监听的地址)，反正记住你的 `auth` 和 `token` 两个选项后面要用，这里假定服务器为 `dns.yourdomain.com`，这个就是你自己搭建的 `dns` 服务器啦以后

2. 这步才是正式开始，比如你有个域名(子域名也行，反正都行，用做这个就不能干别的了) `wild.yourdomain.com`，更改 `wild.yourdomain.com` 的 `ns` 记录到 `dns.yourdomain.com`

3. 现在就可以用诸如类似 `127-0-0-1.wild.yourdomain.com` 这样用了，如果你仅仅是想到这步那就可以结束了，如果想申请个证书请往下看

4. 把代码库里的 `dosk_dns.sh` 扔到你的 `acme.sh` 安装目录里(`~/.acme.sh/dosk_dns.sh`)，然后像其他 `dns` 一样配置几个环境变量：

```bash
# 配置你的 DNS 服务器地址，注意结尾没有 /
export Dosk_Server='http://dns.yourdomain.com'
# 配置你的 token 和 auth
export Dosk_Auth=你的auth
export Dosk_Token=你的token
```

5. 申请证书，加上 `--dns dosk_dns` 选项，其他选项你酌情自己更改：

```bash
acme.sh --issue --dns dosk_dns -d wild.yourdomain.com -d *.wild.yourdomain.com
```

6. 没了，结束了