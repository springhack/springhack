       Rax替代React的方法与一些注意事项 - Dosk技术站   

[← Home](/) [About](/about/) [Archives](/archives/) [Subscribe](/atom.xml)

Rax替代React的方法与一些注意事项
====================

Jan 16 2017
-----------

### [](#准备阶段 "准备阶段")准备阶段

> 这个阶段，创建一个标准的 React 项目就可以了，任凭你脚手架或者人肉配置都是可以的。  
> 毕竟，我们只是要一个 React 项目而以。当然，也可以使用已经完成或者写的差不多的项目啦啦啦～～。  
> 这里我推荐一下我自己的脚手架，比较简单暴力没有任何配置项，Github/boot2env ，还包含了一个实用脚本 bootvm ，创建一个项目即可。

### [](#依赖安装 "依赖安装")依赖安装

> 我觉得这里不废话，直接上命令吧0.0:

1  
2  
3  
4  

┌─\[SpringHack@SpringHack\]─\[~/Public/Node.js/GG\]  
└──╼ $cnpm install babel-preset-rax rax-webpack-plugin rax --save-dev  
✔ All packages installed (41 packages installed from npm registry, used 2s, speed 194.13kB/s, json 52(293.32kB), tarball 0B)  
Recently updated (since 2017-01-10): 8 packages (detail see file /Users/SpringHack/Public/Node.js/GG/node\_modules/.recently\_updates.txt)  

> 这里假设你已经配置好 Webpack + React 的项目，并且将要使用 ES6 Class 语法开发React项目，这是必须的。Webpack 是我个人喜好；ES6 Class 也是，但是也是 Rax 必须的。然后，补上上面两个依赖就OK了。我们准备开始真真的写点什么了。

### [](#配置修改 "配置修改")配置修改

> 其实最少只要修改一个文件就好了，但是这里我演示下我的配置。

###### [](#package-json "package.json:")package.json:

> (因为我将 babel 参数写在这里，当然你可以写在 webpack 配置或者 .babelrc 里面，随心咯)

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

"babel": {  
 "presets": \[  
 "rax",  
 "latest",  
 "stage-0"  
 \],  
 "plugins": \[  
 "babel-plugin-transform-decorators-legacy",  
 "react-hot-loader/babel"  
 \]  
}  

> 其实就是将 react 换成 rax 了 0.0

###### [](#webpack-config-js "webpack.config.js:")webpack.config.js:

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

plugins: \[  
 new RaxWebpackPlugin({  
 target: 'bundle',  
 externalBuiltinModules: false,  
 })  
\],  
resolve: {  
 alias: {  
 'react': 'rax',  
 'react-dom': 'rax'  
 }  
}  

> 意思是加上这两部分，酱紫我们可以按照

1  

import {Component} from 'react';  

> 来写代码，但是最后引入的是 Rax ，其实最重要的目的在于兼容一些 React 组件库。这里 **有个坑** 后文再说。

### [](#开始写代码啦啦啦 "开始写代码啦啦啦")开始写代码啦啦啦

> 无论是写好的 html ，还是 webpack 插件生成的 html ，我们这里需要包含 web-rax-framework 框架本身。所以，提前引入好，代码如下:

1  

<script src="//unpkg.com/web-rax-framework@0.1.3/dist/framework.web.js"></script>  

> 然后才是正经的代码:

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
40  

/\*\*  
 Author: SpringHack - springhack@live.cn  
 Last modified: 2017-01-17 01:06:56  
 Filename: main.js  
 Description: Created by SpringHack using vim automatically.  
\*\*/  
import 'babel-polyfill';  
import {createElement, render} from 'react-dom';  
import App from './jsx/App.jsx';  
  
render(<App />, document.getElementById('app'));  
  
  
  
/\*\*  
 Author: SpringHack - springhack@live.cn  
 Last modified: 2017-01-17 01:06:49  
 Filename: App.jsx  
 Description: Created by SpringHack using vim automatically.  
\*\*/  
import {Component} from 'react';  
import {createElement} from 'react-dom';  
  
export default class extends Component {  
 constructor(props) {  
 super(props);  
 this.state = {  
 name : 'Alxw'  
 };  
 }  
 render()  
 {  
 return (  
 <div>  
 <h2>{this.state.name}</h2>  
 <button onClick={e => this.setState({name : 'Dosk'})}>Click</button>  
 </div>  
 );  
 }  
}  

### [](#试试效果 "试试效果")试试效果

> 测试一下，嗯，不错的。

### [](#第三方组件库 "第三方组件库")第三方组件库

> 科科，那么我们来测试下第三方组件库吧。我是学弟口中用着 Mac 的土豪(你才土豪啊摔，攒了一年才买的啊摔)，本命却是 Google 的死忠粉，于是，我选择符合 Material Design 的 MUICSS 库。来来来，看代码0.0:

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
40  
41  
42  
43  

/\*\*  
 Author: SpringHack - springhack@live.cn  
 Last modified: 2017-01-17 01:06:56  
 Filename: main.js  
 Description: Created by SpringHack using vim automatically.  
\*\*/  
import 'babel-polyfill';  
import {createElement, render} from 'react-dom';  
import App from './jsx/App.jsx';  
import 'muicss/dist/css/mui.min.css'; //这里引入 muicss 的 css 0.0  
  
render(<App />, document.getElementById('app'));  
  
  
  
/\*\*  
 Author: SpringHack - springhack@live.cn  
 Last modified: 2017-01-17 01:06:49  
 Filename: App.jsx  
 Description: Created by SpringHack using vim automatically.  
\*\*/  
import {Component} from 'react';  
import {createElement} from 'react-dom';  
import {Button} from 'muicss/react'; //引入 muicss 的 Button 组件  
  
export default class extends Component {  
 constructor(props) {  
 super(props);  
 this.state = {  
 name : 'Alxw'  
 };  
 }  
 render()  
 {  
 return (  
 <div>  
 <h2>{this.state.name}</h2>  
 {/\* 注意大小写变了，这是 muicss 的组件 \*/}  
 <Button onClick={e => this.setState({name : 'Dosk'})}>Click</Button>  
 </div>  
 );  
 }  
}  

### [](#再次测试效果 "再次测试效果")再次测试效果

> 测试下吧。WTF？？？Component找不到？？？逗我？？？这里就是前文说的 **坑** 了  
> 为什么？我们看下 Rax 的 index.js 的源码:

### [](#查找问题 "查找问题")查找问题

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

import './debug/devtools';  
  
export {createElement, cloneElement, isValidElement, createFactory} from './element';  
export Component from './component';  
export PureComponent from './purecomponent';  
export PropTypes from './proptypes';  
export render from './render';  
export findDOMNode from './findDOMNode';  
export unmountComponentAtNode from './unmountComponentAtNode';  
export findComponentInstance from './findComponentInstance';  
export setNativeProps from './setNativeProps';  
export version from './version';  
export {setDriver, getDriver} from './driver';  

> 嗯，貌似没什么问题嘛，呐呐，再看看 muicss 的 Button 组件的源码:

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

'use strict';  
  
import React from 'react';  
  
import \* as jqLite from '../js/lib/jqLite';  
import \* as util from '../js/lib/util';  
  
const PropTypes = React.PropTypes,  
 btnClass = 'mui-btn',  
 btnAttrs = {color: 1, variant: 1, size: 1};  
  
class Button extends React.Component { ...  
//悄悄的告诉你这里省略了嘘～～～  

> 貌似也没什么问题嘛0.0  
> 等等，woc，muicss 的引入方式是引入的模块 default …  
> 但是 Rax并没提供 export default 23333333 …  
> 但是 React 是提供兼容了的 …

### [](#解决问题 "解决问题")解决问题

> 那我们我们怎么解决的呢 …  
> 其实蛮简单的 …  
> 我们新建文件如下:

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

/\*\*  
 Author: SpringHack - springhack@live.cn  
 Last modified: 2017-01-17 01:06:40  
 Filename: src/client/rax-default.js  
 Description: Created by SpringHack using vim automatically.  
\*\*/  
export {  
 createElement,  
 cloneElement,  
 isValidElement,  
 createFactory,  
 Component,  
 PureComponent,  
 PropTypes,  
 render,  
 findDOMNode,  
 unmountComponentAtNode,  
 findComponentInstance,  
 setNativeProps,  
 version,  
 setDriver,  
 getDriver  
} from 'rax';  
  
import \* as React from 'rax';  
  
export default React;  

> 想必有些人明白了，他不这么做，我们替他这么做一下不就得了。  
> 不过，有些人问了，还要每次 import 这个文件么？No，不需要的。记得之前的 webpack 配置文件么？修改如下:

1  
2  
3  
4  
5  
6  

resolve: {  
 alias: {  
 'react': path.resolve(\_\_dirname, 'src/client/rax-default.js'),  
 'react-dom': path.resolve(\_\_dirname, 'src/client/rax-default.js')  
 }  
}  

> 相当于我们搞了个 wrapper 层，不过没有 webpack 中间件那么麻烦啦～～～  
> 好了，我们试试效果，嗯，Nice～～～

### [](#最后的最后 "最后的最后")最后的最后

> 体积大大减小，速度还可以咯，把 CDN 那部分拿下来放到自己的 CDN 应该会更 OK ～  
> 我很喜欢这个项目，毕竟在那里呆过一阵子。前提是他不要成为 KPI 项目，但愿吧。。。  
> And ，配个图，表示我真的写了这些代码 23333

![SpringHack](https://wx2.sinaimg.cn/large/7eb49035ly1fbt0tq4mfyj22801e04ce.jpg)