       Node.js异步IO实现浅析 - Dosk技术站   

[← Home](/) [About](/about/) [Archives](/archives/) [Subscribe](/atom.xml)

Node.js异步IO实现浅析
===============

Feb 04 2017
-----------

### [](#前情提要 "前情提要")前情提要

> 其实就是对 Node.js 的异步 IO 很感兴趣，加之最近可能要定制 Node.js ，所以决定研究研究看看。本身是 C/C++ 出身，看这点代码还是轻车熟路的，分析中并没有涉及 V8 的内部实现。  
> 版本：[e116cbe3207a471b3d604466baad49b141e32230](https://github.com/nodejs/node/tree/e116cbe3207a471b3d604466baad49b141e32230)

### [](#入口点 "入口点")入口点

> 因为是要研究研究异步 IO ，我觉得从 fs 模块下手是最简单的了。源码通过 Git 克隆下来以后，直觉告诉我 fs 模块的源码入口点在 lib 里面。这里我从 fs.readFile 开始下手。

### [](#层层深入-JS层 "层层深入 - JS层")层层深入 - JS层

> 基于我克隆的版本的这个函数定义是在 fs.js 的 253 行，代码如下：

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
14  
15  
16  
17  
18  
19  
20  
21  
22  
23  
24  
25  

fs.readFile = function(path, options, callback) {  
 callback = maybeCallback(arguments\[arguments.length - 1\]);  
 options = getOptions(options, { flag: 'r' });  
  
 if (!nullCheck(path, callback))  
 return;  
  
 var context = new ReadFileContext(callback, options.encoding);  
 context.isUserFd = isFd(path); // file descriptor ownership  
 var req = new FSReqWrap();  
 req.context = context;  
 req.oncomplete = readFileAfterOpen;  
  
 if (context.isUserFd) {  
 process.nextTick(function() {  
 req.oncomplete(null, path);  
 });  
 return;  
 }  
  
 binding.open(pathModule.\_makeLong(path),  
 stringToFlags(options.flag || 'r'),  
 0o666,  
 req);  
};  

> 这段代码的逻辑不解释了基本都看得明白，最后的调用 binding.open 的是原生调用，实现基于 C++ ，具体因为不是关注重点我直接忽略了。  
> 关于 fd 的判断直接忽略，我们关注到创建的 FSReqWrap 的 context 是一个 ReadFileContext 实例；oncomplete 指向一个读文件的回调，进入它可以看到：

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
14  
15  
16  
17  
18  
19  
20  
21  
22  
23  
24  
25  
26  
27  
28  
29  
30  
31  
32  
33  
34  
35  
36  
37  
38  
39  

function readFileAfterOpen(err, fd) {  
 var context = this.context;  
  
 if (err) {  
 context.callback(err);  
 return;  
 }  
  
 context.fd = fd;  
  
 var req = new FSReqWrap();  
 req.oncomplete = readFileAfterStat;  
 req.context = context;  
 binding.fstat(fd, req);  
}  
  
function readFileAfterStat(err, st) {  
 var context = this.context;  
  
 if (err)  
 return context.close(err);  
  
 var size = context.size = st.isFile() ? st.size : 0;  
  
 if (size === 0) {  
 context.buffers = \[\];  
 context.read();  
 return;  
 }  
  
 if (size > kMaxLength) {  
 err = new RangeError('File size is greater than possible Buffer: ' +  
 \`0x${kMaxLength.toString(16)} bytes\`);  
 return context.close(err);  
 }  
  
 context.buffer = Buffer.allocUnsafeSlow(size);  
 context.read();  
}  

> 这里直接我跳过两个方法的分析， 但是要注意 this 的指向和 context 的传递 0.0 ，最后我们看到了 context.read ，context 是一步一步传递下来的 ReadFileContext 实例，我们进入它的定义看看：

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
14  
15  
16  
17  
18  
19  
20  
21  

ReadFileContext.prototype.read = function() {  
 var buffer;  
 var offset;  
 var length;  
  
 if (this.size === 0) {  
 buffer = this.buffer = Buffer.allocUnsafeSlow(kReadFileBufferLength);  
 offset = 0;  
 length = kReadFileBufferLength;  
 } else {  
 buffer = this.buffer;  
 offset = this.pos;  
 length = this.size - this.pos;  
 }  
  
 var req = new FSReqWrap();  
 req.oncomplete = readFileAfterRead;  
 req.context = this;  
  
 binding.read(this.fd, buffer, offset, length, -1, req);  
};  

> 最终我们还是遇到了 binding.read 。这个调用之前的逻辑我相信大家看得懂，我们开始进入 C++ 的世界了 ==

### [](#层层深入-C-层 "层层深入 - C++层")层层深入 - C++层

> 这段代码定义在哪呢？我不知道各位有木有研究过 node 的 native 模块定义，其实这段代码很好找，过程不说了文件其实是：node\_file.cc

> 基于我克隆的版本，绑定在 1457 行, 定义在 1192 行，最后调用了一个宏：ASYNC\_CALL ，我们看到注释：

1  
2  
3  
4  
5  
6  
7  
8  
9  

Wrapper for read(2).  
  
bytesRead = fs.read(fd, buffer, offset, length, position)  
  
0 fd        integer. file descriptor  
1 buffer    instance of Buffer  
2 offset    integer. offset to start reading into inside buffer  
3 length    integer. length to read  
4 position  file position - null for current position  

> 可能会引起误解，这里的意思是接口兼容 [read(2)](http://www.man7.org/linux/man-pages/man2/read.2.html) 实现，但是其实不是基于read(2) ，而是使用宏 ASYNC\_CALL 方式调用，我们深入 ASYNC\_CALL 研究到它是 ASYNC\_DEST\_CALL 的宏，而 ASYNC\_DEST\_CALL 定义的内容如下：

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
14  
15  
16  
17  
18  
19  

#define ASYNC\_DEST\_CALL(func, request, dest, encoding, ...)                   \\  
 Environment\* env = Environment::GetCurrent(args);                           \\  
 CHECK(request->IsObject());                                                 \\  
 FSReqWrap\* req\_wrap = FSReqWrap::New(env, request.As<Object>(),             \\  
 #func, dest, encoding);                \\  
 int err = uv\_fs\_ ## func(env->event\_loop(),                                 \\  
 req\_wrap->req(),                                   \\  
 \_\_VA\_ARGS\_\_,                                       \\  
 After);                                            \\  
 req\_wrap->Dispatched();                                                     \\  
 if (err < 0) {                                                              \\  
 uv\_fs\_t\* uv\_req = req\_wrap->req();                                        \\  
 uv\_req->result = err;                                                     \\  
 uv\_req->path = nullptr;                                                   \\  
 After(uv\_req);                                                            \\  
 req\_wrap = nullptr;                                                       \\  
 } else {                                                                    \\  
 args.GetReturnValue().Set(req\_wrap->persistent());                        \\  
 }  

> 别告诉我 ## 和 # 宏定义你不认识，因为我发现我周围基本没几个人认识(可能我们一群菜鸡Orz…)，其实按照当前的层次深入，就是调用了 uv\_fs\_read ，可知这是一个 libuv 提供的接口。  
> 不过我们发现，其提供的 event\_loop 来自参数作用域，我们想深入探究一下其作用域，根据调用栈回溯一下得到参数来自 fs.js

### [](#结论 "结论")结论

###### [](#基于已知的-JS-知识得到结论： "基于已知的 JS 知识得到结论：")基于已知的 JS 知识得到结论：

> Node.js 的 IO 操作来自 libuv 的线程池，event\_loop 基于 Node.js 给定的 JS 事件循环，JS 代码的运行环境是单线程的，但是 IO 操作是基于 libuv 的线程池中的其他线程 ==

### [](#最后 "最后")最后

> 感谢您阅读我的瞎分析 -。-