---
layout: post
title: Node N-API 实现其他线程连续 Callback 的一种方案
categories: code
description: 类似于长轮训
keywords: napi, n-api, callback, nodejs
---

### 这个方案抛开了 `libuv` 和 `ABI` 未稳定的接口，完全使用 `AsyncWorker` 实现

> 具体来讲，类似于长轮训，每次都新建一个 `AsyncWorker` 并 `wait`，等待有需要的时候再继续进行下去

> 代码非常简单，这里直接贴出来

```cpp
/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2019-04-17 01:23:57
 *  Filename: thread_callback.cc
 *  Description: Created by SpringHack using vim automatically.
 */
#include "napi.h"
#include "thread_callback.h"

#include <thread>
#include <mutex>


std::mutex js_mutex;
std::condition_variable js_cond;

using namespace Napi;

FunctionReference host_callback;
void noop(const CallbackInfo& info) {}

class ThreadCallbackWorker : public AsyncWorker {
private:
  void Execute() override {
    std::unique_lock<std::mutex> lock(js_mutex);
    js_cond.wait(lock);
  }
  void OnOK() override {
    HandleScope scope(Env());
    host_callback.Call({});
    ThreadCallbackWorker::StartWork(Env());
  }
public:
  ThreadCallbackWorker(Function& cb, const char* resource_name) : AsyncWorker(cb, resource_name) {}
  static void StartWork(Napi::Env&& env) {
    Function _noop = Function::New(env, noop);
    ThreadCallbackWorker* worker = new ThreadCallbackWorker(_noop, "ThreadCallbackWorker");
    worker->Queue();
  }
};


void setCallback(Env& env, Function& cb) {
  host_callback = Persistent(cb);
  ThreadCallbackWorker::StartWork(std::move(env));
}

void triggerCallback() {
  js_cond.notify_all();
}
```

> 里面暴露了两个方法，用法如下

```
/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2019-04-17 01:24:19
 *  Filename: main.cc
 *  Description: Created by SpringHack using vim automatically.
 */
#include "napi.h"
#include "thread_callback.h"

#include <thread>
#include <chrono>
#include <ctime>


using namespace Napi;

FunctionReference js_cb;

void time_tick() {
  while (true) {
    std::this_thread::sleep_for(std::chrono::seconds(2));
    triggerCallback();
  }
}

void JSCallbackInvoker(const CallbackInfo& info) {
  Env env = info.Env();
  time_t now = time(0);
  char* dt = ctime(&now);
  js_cb.Call({
    String::New(env, dt)
  });
}

Value StartWork(const CallbackInfo& info) {
  // Get env
  Env env = info.Env();
  // Store origin js callback
  js_cb = Persistent(info[0].As<Function>());
  // Setup our invoker as callback
  Function cb = Function::New(env, JSCallbackInvoker);
  setCallback(env, cb);
  // Start worker thread
  std::thread(time_tick).detach();
  // Return undefined
  return env.Undefined();
}

Object Init(Env env, Object exports) {
  exports.Set(String::New(env, "startWork"), Function::New(env, StartWork));
  return exports;
}

NODE_API_MODULE(napi_callback_thread, Init)
```

> 这里新建的 `time_tick` 是用来测试的代码，每隔 2 秒进行一次 `triggerCallback`，让我们进入到 `js` 主线程做事情，而且拥有完整的 `async_context`(`JSCallbackInvoker`)

### Features && Bugs

> 这里依托了 `N-API` 的 `C++` 接口实现，所以是可以在 `worker_threads` 开启的线程里面运行的

> 但是这里设置了全局的 `FunctionReference`，所以两个以上线程一起调用会产生 `Bug`，需要根据线程 `id` 来建立映射关系

> 完整代码详见 [Github][https://github.com/springhack/napi-thread-callback]


