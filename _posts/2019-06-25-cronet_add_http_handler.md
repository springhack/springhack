---
layout: post
categories:
  - code
published: true
filename: '2019-06-25 23:48 +0800'
description: 如何实现协议拦截
keywords: 'cronet, chromium, electron'
title: Chromium 实现 http(s) 协议拦截解析
---
### Chromium 的 http 实现

这里简单提一下，其实封装的很完备，可以参考: [Here](https://www.jianshu.com/p/5ac0fb68cedc)

### 简单实现

> 我就不贴代码了，因为一些保密的原因

这里我使用 Electron 的源码进行验证，主要是手头只有 Electron 代码，不想在拉别的东西

1. 修改 Electron net 层
2. 暴露 `registerSDKProtocol` 接口作为功能入口
3. 使用 `class RustSDKProtocolHandler : public net::URLRequestJobFactory::ProtocolHandler` 实现请求 handler
4. 使用 `net::URLRequestJob* request_job = net::URLRequestHttpJob::Factory(request, network_delegate, "https");` 重定向不关心请求
5. 实现 `net::URLRequestSimpleJob` 内处理 Rust SDK 逻辑
6. 请求 url 带特殊 host，host 作为触发特殊请求的表示，例：https://native-sdk.zjurl.cn/${imagePath}
7. 多个 host 解决并发量问题

> PS: 处理请求的时候可能在别的线程，那么就需要建立一个新的 `base::TaskRunner`

```cpp
base::WeakPtrFactory<RustSDKRequestJob> weak_factory_;
scoped_refptr<base::TaskRunner> task_runner_ = base::CreateTaskRunnerWithTraits({base::TaskPriority::USER_VISIBLE});
```

> 当需要跑的时候，就 `PostTask`，最后一个参数是当前 Job 的指针

```cpp
task_runner_->PostTask(FROM_HERE, base::BindOnce(&dosk::NativeSDKRequestJob::WorkerThread, weak_factory_.GetWeakPtr()));
```

> 等任务结束之后，需要再通过这种方式 Post 回 `content::BrowserThread::UI`

### 测试

1. 这里会有一个并发量的限制，是 Chromium 本身的，不太想过多干预
2. 如果实在是想干预，那么就通过伪造 host 的方式实现，因为也是通过 host 来实现并发量限制的
3. 图中上面的请求体现出了并发限制，比较奇怪的是后面的请求时间，其实并不是 4s，只是我们的实现对于 timeline 显示效果有影响，体验上是一致的

![cronet.png]({{site.baseurl}}/uploads/cronet.png)


