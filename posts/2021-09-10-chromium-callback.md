---
date: 2021-09-10 16:56:51 +0000
layout: post
title: Chromium 代码下并发 Callback 的骚操作
categories:
- code
description: 当并发的所有 callback 都结束时再触发一个 callback，搞了一个 template 骚操作

---
### 背景

> 我狗哥想同时发起多个异步操作，并在都结束时去处理结果；我说你写个状态机就行了呗，他觉的麻烦(嗯，麻烦是他的口头禅了)，
>
> 代码库是 `chromium`，所以我决定想办法在 `base::OnceCallback` 上做做文章

### 调研

1. 首先想到的是，这个操作像极了 `js` 的 `Promise.all`，人家专门制定了规范来干这事，但是 `chromium` 似乎并不认为这是个很常见的操作
2. 搜了下 `base` 最后发现还是有相关方法的，一个叫 [base::BarrierCallback](https://source.chromium.org/chromium/chromium/src/+/main:base/barrier_callback.h;l=93) 另一个叫 [base::BarrierClosure](https://source.chromium.org/chromium/chromium/src/+/main:base/barrier_closure.h)，其实没差太多
3. 我觉得这两个不够好，所以决定写一个 `template` 来搞搞

### 整活

> 我就不啰嗦了，直接贴代码吧

```cpp
/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2021-09-11 00:08:59
 *  Filename: neotix_callback_helper.h
 *  Description: Created by SpringHack using vim automatically.
 */
#ifndef _NEOTIX_CALLBACK_HELPER_H_
#define _NEOTIX_CALLBACK_HELPER_H_

#include "base/atomic_ref_count.h"
#include "base/callback.h"
#include "base/callback_helpers.h"
#include "base/memory/weak_ptr.h"

namespace neotix {
namespace callback {

template <typename... CallbackTypes>
class UnionCallback {
 public:
  using FinallyCallback = base::OnceCallback<void(
      std::unique_ptr<UnionCallback<CallbackTypes...>>)>;

  class CallbackResultBase {};

  template <typename... InvokeTypes>
  class CallbackResult : public CallbackResultBase {
   public:
    std::tuple<InvokeTypes...> result;
  };

  class UnionCallbackWrapper {
   public:
    explicit UnionCallbackWrapper(UnionCallback<CallbackTypes...>* ptr)
        : ptr_(ptr) {}
    ~UnionCallbackWrapper() = default;
    UnionCallback<CallbackTypes...>* operator->() { return ptr_; }
    void Reset() {
      if (ptr_) {
        delete ptr_;
      }
      ptr_ = nullptr;
    }

   private:
    UnionCallback<CallbackTypes...>* ptr_;
  };

  static UnionCallbackWrapper Create() {
    UnionCallbackWrapper wrapper(new UnionCallback<CallbackTypes...>());
    return wrapper;
  }

  explicit UnionCallback() {
    counter_.Increment(callback_count);
    results_.resize(callback_count);
  }

  ~UnionCallback() = default;

  template <size_t index,
            typename CallbackType = typename std::
                tuple_element<index, std::tuple<CallbackTypes...>>::type>
  CallbackType GetCallback() {
    CallbackType cb = base::DoNothing();
    return GetCallbackInternal<index>(std::move(cb));
  }

  template <size_t index,
            typename CallbackType = typename std::
                tuple_element<index, std::tuple<CallbackTypes...>>::type>
  auto GetResult() {
    CallbackType cb = base::DoNothing();
    return GetResultInternal<index>(std::move(cb));
  }

  void Finally(FinallyCallback finally_cb) {
    finally_cb_ = std::move(finally_cb);
  }

 private:
  template <size_t index, typename... InvokeTypes>
  base::OnceCallback<void(InvokeTypes...)> GetCallbackInternal(
      base::OnceCallback<void(InvokeTypes...)>) {
    return base::BindOnce(
        &UnionCallback<CallbackTypes...>::DoCallbackInternal<index,
                                                             InvokeTypes...>,
        weak_factory_.GetWeakPtr());
  }

  template <size_t index,
            typename... InvokeTypes,
            typename ResultType = std::tuple<InvokeTypes...>>
  ResultType GetResultInternal(base::OnceCallback<void(InvokeTypes...)>) {
    CallbackResult<InvokeTypes...>* result =
        static_cast<CallbackResult<InvokeTypes...>*>(results_[index].get());
    if (!result) {
      CallbackResult<InvokeTypes...> default_result;
      return default_result.result;
    }
    return result->result;
  }

  template <size_t index, typename... InvokeTypes>
  void DoCallbackInternal(InvokeTypes... args) {
    if (!results_[index]) {
      CallbackResult<InvokeTypes...>* result =
          new CallbackResult<InvokeTypes...>();
      result->result = std::make_tuple(args...);
      results_[index].reset(result);
    }
    counter_.Decrement();
    if (counter_.IsZero()) {
      std::unique_ptr<UnionCallback<CallbackTypes...>> self(this);
      std::move(finally_cb_).Run(std::move(self));
    }
  }

  base::AtomicRefCount counter_;
  FinallyCallback finally_cb_ = base::DoNothing();
  const size_t callback_count = sizeof...(CallbackTypes);
  std::vector<std::shared_ptr<CallbackResultBase>> results_;
  base::WeakPtrFactory<UnionCallback<CallbackTypes...>> weak_factory_{this};
};

}  // namespace callback
}  // namespace neotix

#endif  // _NEOTIX_CALLBACK_HELPER_H_
```

> 再放个 `demo` 的代码

```cpp
using UnionCallbackDemo = neotix::callback::UnionCallback<
    base::OnceCallback<void(int)>,
    base::OnceCallback<void(bool, std::string)>>;
auto union_callback_demo = UnionCallbackDemo::Create();
union_callback_demo->Finally(
    base::BindOnce([](std::unique_ptr<UnionCallbackDemo> self) {
      LOG(INFO) << "NEOTIX: int=" << std::get<0>(self->GetResult<0>())
                << " bool=" << std::get<0>(self->GetResult<1>())
                << " string=" << std::get<1>(self->GetResult<1>());
    }));
union_callback_demo->GetCallback<0>().Run(110);
union_callback_demo->GetCallback<1>().Run(true, "springhack");
```

> 最后放个输出

```shell
[0911/004906.165587:INFO:union_callback_demo.cc(109)] NEOTIX: int=110 bool=1 string=springhack
```

> 效果还不错叭！不过多线程安全的地方没太关心，完美转发也懒得写

### 最后

其实就是手痒了想再写写模板玩玩，类型体操是永恒的话题，各种语言都是
