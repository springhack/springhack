---
layout: post
filename: OpenWrt-tian-jia-yi-ge-socat-de-luci-web-jie-mian
title: OpenWrt 添加一个 socat 的 luci web 界面
categories:
  - code
description: 不搞单独 app 了，就俩文件
---
* 首先安装几个依赖：`opkg update && opkg install socat luci luci-base luci-compat`
* 终端开启 `socat` 服务：`/etc/init.d/socat enable && /etc/init.d/socat start`
* 添加如下两个文件，格式按照 `/etc/config/socat` 来搞就行
* `/usr/lib/lua/luci/controller/socat.lua`

```lua
module("luci.controller.socat", package.seeall)

function index()
  entry({"admin","services","socat"}, cbi("socat"), "Socat", 100)
end
```

* `/usr/lib/lua/luci/model/cbi/socat.lua`

```lua
require("luci.sys")

m = Map("socat", translate("Socat Service"), translate("Configure socat service"))

s = m:section(TypedSection, "socat", "")
s.addremove = true
s.anonymous = false

enable = s:option(Flag, "enable", translate("Enable"))
enable.rmempty = false

run_as = s:option(Value, "user", translate("Run As"))
run_as.default = 'root'
run_as.rmempty = false

options = s:option(TextValue, "SocatOptions", translate("Socat Options"))
options.default = 'TCP6-LISTEN:12345,fork,reuseaddr TCP:10.10.10.10:12345'
options.rmempty = false

local apply = luci.http.formvalue("cbi.apply")
if apply then
  io.popen("/etc/init.d/socat restart")
end

return m
```