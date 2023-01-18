       阿里巴巴Rax渲染引擎简单试用 - Dosk技术站   

[← Home](/) [About](/about/) [Archives](/archives/) [Subscribe](/atom.xml)

阿里巴巴Rax渲染引擎简单试用
===============

Jan 13 2017
-----------

### [](#起因 "起因")起因

> 今天在开源中国看到的新闻，立刻就来测试了。其实一开始看到后想到两件事：

> 1.  是不是又是 KPI 项目，总是做这种事都怕了;

> 2.  轻量级的 React 也有人搞过了 (PReact) 阿里这边是做什么妖0.0.

> 但是看了 GitHub 以后明白了为什么要搞这件事。其实目的很简单，为 Weex 蓬勃发展传教。

> 之前在滨江区的时候有幸参加了一次 Weex 布道(没记错的话是7月25日)，总的来说初期的 Weex 是依赖 Vue.js 作为前端，那时候在现场就有人问到是不是后期会引入 React 的前端支持，(表示并没有记住花名)就回答说会的。现在看来，这算是兑现了当初的承诺。

> 看到 Demo 的第一印象是 Component 是从 rax-component 引入的，会不会只是作为 Weex 的接口而不能完美兼容 React 呢？普通的 HTML Tags 是否也做了封装呢？看了下 Docs 的 Difference ，并没有提到这些，所以我决定试试看。

### [](#安装 "安装")安装

> 安装过程，文档写的很清楚，我这里不全局安装了(因为 ./node\_modules/.bin 是在我的 $PATH 里面的hhh)：

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
44  
45  
46  
47  
48  
49  
50  

┌─\[SpringHack@SpringHack\]─\[~/Public/Node.js\]  
└──╼ $ npm install rax-cli  
/Users/SpringHack/Public/Node.js  
└─┬ rax-cli@0.1.2  
 ├─┬ chalk@1.1.3  
 │ ├── ansi-styles@2.2.1  
 │ ├── escape-string-regexp@1.0.5  
 │ ├─┬ has-ansi@2.0.0  
 │ │ └── ansi-regex@2.0.0  
 │ ├── strip-ansi@3.0.1  
 │ └── supports-color@2.0.0  
 ├─┬ cross-spawn@4.0.2  
 │ ├─┬ lru-cache@4.0.2  
 │ │ ├── pseudomap@1.0.2  
 │ │ └── yallist@2.0.0  
 │ └─┬ which@1.2.12  
 │   └── isexe@1.1.2  
 ├─┬ easyfile@0.1.1  
 │ └─┬ mkdirp@0.5.1  
 │   └── minimist@0.0.8  
 ├── minimist@1.2.0  
 └─┬ prompt@0.2.14  
 ├── pkginfo@0.4.0  
 ├─┬ read@1.0.7  
 │ └── mute-stream@0.0.7  
 ├── revalidator@0.1.8  
 ├─┬ utile@0.2.1  
 │ ├── async@0.2.10  
 │ ├── deep-equal@1.0.1  
 │ ├── i@0.3.5  
 │ ├── ncp@0.4.2  
 │ └─┬ rimraf@2.5.4  
 │   └─┬ glob@7.1.1  
 │     ├── fs.realpath@1.0.0  
 │     ├─┬ inflight@1.0.6  
 │     │ └── wrappy@1.0.2  
 │     ├── inherits@2.0.3  
 │     ├─┬ minimatch@3.0.3  
 │     │ └─┬ brace-expansion@1.1.6  
 │     │   ├── balanced-match@0.4.2  
 │     │   └── concat-map@0.0.1  
 │     ├── once@1.4.0  
 │     └── path-is-absolute@1.0.1  
 └─┬ winston@0.8.3  
 ├── colors@0.6.2  
 ├── cycle@1.0.3  
 ├── eyes@0.1.8  
 ├── isstream@0.1.2  
 ├── pkginfo@0.3.1  
 └── stack-trace@0.0.9  

### [](#测试 "测试")测试

> 新建工程

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

┌─\[SpringHack@SpringHack\]─\[~/Public/Node.js\]  
└──╼ $rax init hello-world  
Creating a new Rax project in /Users/SpringHack/Public/Node.js/hello-world  
Install dependencies:  
...  
npm WARN rax-starter-kit@0.0.0 No repository field.  
npm WARN rax-starter-kit@0.0.0 No license field.  
To run your app:  
 cd hello-world  
 npm run start  

> 进入文件夹并 start 理论上会看到如同 Github 截图类似的画面，但是我并没有看到，只有两个错误。很明显，webpack 打包的部分出问题了。为了继续测试，我们用 [Here](http://rax.taobaofed.org/playground/) 的 Playground 继续测试。

1  
2  
3  
4  

framework.web.js:2Uncaught ReferenceError: define is not defined		(anonymous) @ framework.web.js:2  
 at framework.web.js:2  
index.bundle.js:2Uncaught ReferenceError: define is not defined			(anonymous) @ index.bundle.js:2  
 at index.bundle.js:2  

> 我们的代码如下:

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

import {createElement, Component, render} from 'rax';  
import {View, Text} from 'rax-components';  
  
class App extends Component {  
 constructor(props) {  
 super(props);  
 this.state = {name : 'Alxw'};  
 }  
 componentWillMount() {  
 this.clickA = e => this.setState({name : 'SpringHack'});  
 }  
 render() {  
 return (  
 <View style={styles.container}>  
 <Text>Name is: {this.state.name}</Text>  
 <button onClick={() => this.clickA()}>Change Name to SpringHack</button>  
 <button onClick={() => this.clickB()}>Change Name to Dosk</button>  
 </View>  
 );  
 }  
 componentDidMount() {  
 this.clickB = e => this.setState({name : 'Dosk'});  
 }  
}  
  
const styles = {  
 container: {  
 flex: 1,  
 justifyContent: 'center',  
 alignItems: 'center',  
 }  
};  
  
render(<App />);  

> 图上就会出现一行字和两个按钮，并且都是有效的，这只少证明了生命周期是兼容的(当然，shouldComponentUpdate 等我并没测试，不过想来应该是兼容的)。  
> 至于全家桶方面呢？提供了 rax-redux ，可以用 Redux 是肯定的了，不过我在使用 React 的时候就不喜欢 Redux ，强烈建议适配 MobX 。

### [](#其他的不同 "其他的不同")其他的不同

> 这里看了下，只能使用 ES6 的 class 语法来继承，挺好的，时代在发展(-。-)；

> setState 方法是同步的，而 React 的是异步的(记得某篇文章提过可以同步调用，React 内部实现)；

> Render to new container node not clear existed children，不太清楚具体意思0.0；

> findDOMNode 可以接受 id 作为参数，和 selector 类似啊0.0；

> PropTypes 只是用来作为兼容的，没有实际用途(赞同，基本不用，但是严格的规范中最好使用)。

### [](#其他 "其他")其他

> 我反正是很支持的，只要这个项目不是真的是 KPI 项目就OK了。

> HTML Tags 也是支持的，在浏览器情况下。至于那个 define 的问题，估计是我之前安装过 webpack 旧版本吧，之前坑过一次，权当没发现好了2333。