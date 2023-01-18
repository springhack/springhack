---
layout: post
categories:
  - code
published: true
title: 'STL 内 std::{bind/tuple/function} 简单实现'
keywords: 'cpp,stl,std,bind,tuple,function,'
description: 记录下来自己慢慢品味
---
## 基本逻辑思考

> 首先是实现 `function`，这个比较简单，重载 `operator()` 就好，这里只实现对函数指针的包装

> 其次是实现 `tuple`，这个会比较绕，通过模板取第一个参数，然后用剩下的参数继续生成 `tuple`并继承，是一种递归的思想

> 有了 `tuple` 就要有 `get()`，这个就更比较绕了，首先是需要类似的方式实现获得 `tuple` 的值类型与元组类型，然后通过强制类型转换，获取对应的层级的 `value`

> 接下来是 `bind`，首先要解决的就是如何保存创建时的参数列表，这里就用到 `tuple` 来保存了

> 奇技淫巧还是运行函数时取相应的元组的对应位置的值，还是类似的方式，通过特化模板，公式是 `<n, indexs...> => <n - 1, n - 1, indexs...>`，比如 `3` 最后会生成 `0 0 1 2` 那么抛弃第一个，并用来展开元组，传递给函数指针

> 最重要的来了，就是如何实现 `placeholders`，简单来说就是在上一步的 `operator()` 增加传入参数，并制造成元组 `r_args`，然后带进一个 `_unwrap_tuple` 类，这里会重载 `operator[]` 根据传入数据结构，如果是 `_placeholders<index>` 那么取 `r_args` 相应的 `index` 位置，否则会直接 `return`

## 代码

> 不多说，还是直接放代码，仅作为参考，有写的不好的地方轻喷

```cpp
/*
 *  Author: SpringHack - springhack@live.cn
 *  Last modified: 2020-02-19 10:16:17
 *  Filename: main.cpp
 *  Description: Created by SpringHack using vim automatically.
 */
#include <iostream>

namespace dosk { // begin namespace dosk

// function
template <typename... T>
class function;

template <typename Result, typename... Args>
class function<Result(Args...)> {
  private:
    Result (*function_)(Args...);
  public:
    typedef Result return_type;
    function() = default;
    function(Result (*fn)(Args...)) : function_(fn) {};
    Result operator()(Args... a) {
      return function_(a...);
    }
    function& operator=(Result (*fn)(Args...)) {
      function_ = fn;
      return *this;
    }
};

// tuple
template <typename... T>
class tuple;

template <typename HEAD, typename... LIST>
class tuple<HEAD, LIST...> : public tuple<LIST...> {
  public:
    HEAD value;
    tuple(HEAD head, LIST... list) : tuple<LIST...>(list...), value(head) {};
};

template <>
class tuple<> {};

// tuple get
template <int index, typename... T>
class _tuple_type;

template <int index, typename HEAD, typename... LIST>
class _tuple_type<index, tuple<HEAD, LIST...>> {
  public:
    typedef typename _tuple_type<index - 1, tuple<LIST...>>::value_type value_type;
    typedef typename _tuple_type<index - 1, tuple<LIST...>>::tuple_type tuple_type;
};

template <typename HEAD, typename... LIST>
class _tuple_type<0, tuple<HEAD, LIST...>> {
  public:
    typedef HEAD value_type;
    typedef tuple<HEAD, LIST...> tuple_type;
};

template <int index, typename HEAD, typename... LIST>
typename _tuple_type<index, tuple<HEAD, LIST...>>::value_type get(tuple<HEAD, LIST...> t) {
  typedef typename _tuple_type<index, tuple<HEAD, LIST...>>::value_type value_type;
  typedef typename _tuple_type<index, tuple<HEAD, LIST...>>::tuple_type tuple_type;
  value_type rv = ((tuple_type)t).value;
  return rv;
}

// bind
template <size_t...>
class _tuple_index {};

template <size_t n, size_t... indexs>
class _make_indexs : public _make_indexs<n - 1, n - 1, indexs...> {};

template<size_t... indexs>
class _make_indexs<0, indexs...> {
  public:
    typedef _tuple_index<indexs...> index_type;
};

namespace placeholders {

template <size_t index>
class _placeholders {};

_placeholders<0> _1;
_placeholders<1> _2;
_placeholders<2> _3;
_placeholders<3> _4;
_placeholders<4> _5;
_placeholders<5> _6;
_placeholders<6> _7;
_placeholders<7> _8;
_placeholders<8> _9;
_placeholders<9> _10;

template <typename... RArgs>
class _unwrap_tuple {
  public:
    tuple<RArgs...> r_args; 
    _unwrap_tuple(tuple<RArgs...> r_args) : r_args(r_args) {};
    template <typename R>
    R operator[](R r) {
      return r;
    }
    template <size_t index>
    auto operator[](placeholders::_placeholders<index>) {
      return get<index>(r_args);
    }
};

};

template <typename Func, typename... Args>
class bind_t {
  public:
    typedef typename _make_indexs<sizeof...(Args)>::index_type _indexs;
    typedef typename Func::return_type return_type;
    Func func;
    tuple<Args...> args;
    bind_t(Func func, Args... args): func(func), args(args...) {}
    template <typename... RArgs>
    return_type operator()(RArgs&&... _r_args) {
      tuple<RArgs...> r_args = tuple<RArgs...>(_r_args...);
      return run(_indexs(), r_args);
    }
    template <size_t... Idx, typename... RArgs>
    return_type run(_tuple_index<Idx...>, tuple<RArgs...> r_args) {
      return func(unwrap_args<Idx>(r_args)...);
    }
    template <size_t index, typename... RArgs>
    auto unwrap_args(tuple<RArgs...> r_args) {
      placeholders::_unwrap_tuple<RArgs...> _u_a(r_args);
      auto _m_a = get<index>(args);
      return _u_a[_m_a];
    }
};

template <typename Func, typename... Args>
bind_t<Func, Args...> bind(Func& func, Args&&... args) {
  return bind_t<Func, Args...>(func, args...);
}

}; // end namespace dosk



// Test code
std::string test_func(int a, const char * b) {
  return std::to_string(a) + std::string(b);
}

std::string test_bind_args(int a, int b, int c, int d, int e) {
  return std::to_string(a) + std::to_string(b) + std::to_string(c) + std::to_string(d) + std::to_string(e);
}

int main() {
  // Test tuple
  dosk::tuple<int, const char *> t(123, "456");
  std::cout << dosk::get<0>(t) << dosk::get<1>(t) << std::endl;
  // Test function
  dosk::function<std::string(int, const char *)> closure_1 = test_func;
  std::cout << closure_1(123, "456") << std::endl;
  // Test bind
  dosk::function<std::string(int, int, int, int, int)> closure_2 = test_bind_args;
  auto binder = dosk::bind(closure_2, 1, dosk::placeholders::_2, 3, dosk::placeholders::_1, 5);
  std::cout << binder(4, 2, 0) << std::endl;
  return 0;
}
```
