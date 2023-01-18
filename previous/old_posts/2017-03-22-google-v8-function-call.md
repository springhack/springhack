       深入探究 JavaScript 的函数调用 - Dosk技术站   

[← Home](/) [About](/about/) [Archives](/archives/) [Subscribe](/atom.xml)

深入探究 JavaScript 的函数调用
=====================

Mar 22 2017
-----------

### [](#定义 "定义")定义

> 可能很多人在学习 JavaScript 过程中碰到过函数参数传递方式的迷惑，本着深入的精神，我想再源码中寻找些答案  
> 不过在做这件事之前，首先明确几个概念。抛弃掉值传递、引用传递等固有叫法，回归英文：  
> `call by reference` && `call by value` && `call by sharing`  
> 分别是我们理解的 C++ 中的引用传递，值传递。第三种比较迷惑，官方解释是 `receives the copy of the reference to object` 。我用通俗的话解释一下：  
> Object 可以理解为 key 的集合，Object 对 key 指向的数据是引用性质的(这里不深究是指针实现还是C++引用实现)，函数接收的是一个变量的 copy，变量包含了 Object 的引用 ，是一个值传递。  
> 那么很明显，函数传参的时候我们接收到的对象型参其实是实参的复制，所以直接更改型参的指向是不可行的；由于 Object 本身的 key 都是引用，所以修改 key 的指向是可行的。

### [](#证明 "证明")证明

> 简单来几段代码即可证明  
> Code 1: 函数能修改 key 指向的数据

1  
2  
3  
4  
5  

let func = obj => { obj.name = 'Dosk' };  
let obj = {name : 'Alxw'};  
console.log(obj);  //{ name: 'Alxw' }  
func(obj)  
console.log(obj);  //{ name: 'Dosk' }  

> Code 2: 函数不能修改 obj

1  
2  
3  
4  
5  

let func = obj => { obj = {} };  
let obj = {name : 'Alxw'};  
console.log(obj);  //{ name: 'Alxw' }  
func(obj)  
console.log(obj);  //{ name: 'Alxw' }  

> Code 3: 内部 obj 和外部 === 结果相等

1  
2  
3  

let def = {name : 'Alxw'};  
let func = obj => { console.log(obj === def) };  
func(def);  //true  

> 所以第三段代码可能有疑问了，既然 obj 是 def 的复制，为什么 === 操作还能够为真？不是说 === 操作对于 Object 比较的是在内存中的地址么，如果是复制应该是 false 才对啊？  
> 所以我们回到 Google V8 的源码来看这件事。

### [](#深入-Google-V8 "深入 Google V8")深入 Google V8

> 我们来看看源码里严格等于操作代码部分：

1  
2  
3  
4  
5  
6  
7  
8  
9  
10  
11  
12  
13  

bool Object::StrictEquals(Object\* that) {  
 if (this->IsNumber()) {  
 if (!that->IsNumber()) return false;  
 return NumberEquals(this, that);  
 } else if (this->IsString()) {  
 if (!that->IsString()) return false;  
 return String::cast(this)->Equals(String::cast(that));  
 } else if (this->IsSimd128Value()) {  
 if (!that->IsSimd128Value()) return false;  
 return Simd128Value::cast(this)->Equals(Simd128Value::cast(that));  
 }  
 return this == that;  
}  

> 看起来应该是最后一种情况，理论上如果 def 和 obj 是不同的对象，那么应该返回 false 才对，这不是推翻了上文所述么？其实不，忽略了一件事，即 Google V8 内部在实例化一个 Object 的时候，本身就是动态实例化，而我们知道在编译型语言中如果动态实例化只能够在堆内存上，即只能够指针引用。这个结论是的证明涉及到 Local 、Handle 等 class 的实现，我觉得太麻烦，有一个简单的证明方式，即搜索源码得到所有调用 `Object::StrictEquals` 的地方都是直接传入而没有取地址操作。  
> 不过有人会问，既然是值传递的变量包含 Object 的引用，理论上也能够修改 Object 才对，为什么第三段代码不能修改呢？  
> 很简单的道理，因为我们在 JavaScript 语言逻辑层次上的所谓的操作，只不过是在调用 Google V8 的实例方的法而已，根本不可能操作到这一地步(当然，潜在的 BUG 不算的 -。-)

### [](#重新定义 "重新定义")重新定义

> 我觉得到这里可以给 `call by sharing` 重新解释一下了：  
> 的确，传递的时候是值传递，但是内容包含了 Object 的指针，而且不能够修改这个指针，他是多个变量共享的。

### [](#另一种简单的证明 "另一种简单的证明")另一种简单的证明

> 来来来，看源码

1  
2  
3  
4  
5  
6  

V8\_DEPRECATE\_SOON("Use maybe version",  
 Local<Value> Call(Local<Value> recv, int argc,  
 Local<Value> argv\[\]));  
V8\_WARN\_UNUSED\_RESULT MaybeLocal<Value> Call(Local<Context> context,  
 Local<Value> recv, int argc,  
 Local<Value> argv\[\]);  

> 上面的是即将弃用的接口，碰巧我看到的这个版本代码包含大量的这种即将弃用的代码，看看就好。重点是第二个接口，是函数的唯一的调用的接口。里面的 `Local<Value>` 最终会调用 C++ 的位复制，所以可以简单的证明就是值传递。

### [](#可能是重点 "可能是重点")可能是重点

> 别忘了，我们定义的的变量都是类似 `Handle<Object>` 这种形式的，所以它们之间对象才是共享的，我们所说的 JavaScript 里面变量并不直接指的是 Object 的实例!!!

### [](#最后的最后 "最后的最后")最后的最后

> 总之理解起来可能很费劲甚至有错误，但是在 JavaScript 语言层次上能够确定了特性，这才是重要的。