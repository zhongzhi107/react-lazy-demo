# 用React.lazy和Suspense优化react代码打包

## 前言
为了让网站加载更快，通常会将前端代码打包。React在16.6提供react.lazy和suspense打包优化方案，本文将介绍react代码打包和懒加载相关的技术。

![code-splitting](https://camo.githubusercontent.com/129f34bba8ba80f8a4a1a037619b5f7076906e06/687474703a2f2f7468656a616d65736b796c652e636f6d2f696d672f72656163742d6c6f616461626c652d73706c69742d62756e646c65732e706e67)

React 16.6 引入了一些[新特性](https://reactjs.org/blog/2018/10/23/react-v-16-6.html)，在 React 组件上使用这些新特性只需要用少量代码就能完成强大的功能。

`React.lazy` 和 `Suspense` 是其中的两个新特性，它们让 React 组件的代码拆分和懒加载变得非常简单。

本文重点介绍这两个新特性如何在 React 应用程序中使用，以及它们为 React 开发人员提供的新潜力。

## 为什么需要拆分代码
在过去的几年中，前端开发发生了很大的变化，随着一些新技术（如 [ES6模块化](http://es6.ruanyifeng.com/#docs/module)、[Babel转换器](https://babeljs.io/)、[Webpack](https://webpack.js.org/) 打包工具）的出现，现在可以用完全模块化的方式来开发 JavaScript 应用。

通常，每个模块都被导入并合并到一个名为 `bundle` 的单个文件中，然后 `bundle` 被包括在一个网页上以加载整个应用程序。然而，随着应用程序的增长，包大小开始变得太大，从而开始影响页面加载时间。

像 Webpack 和 Browserify 这样的打包工具提供了 [code splitting](https://webpack.js.org/guides/code-splitting/#src/components/Sidebar/Sidebar.jsx) 对代码拆分的支持，它包括将代码拆分为不同的 `bundle` ，这些 `bundle` 可以懒加载，而不是一次全部加载，从而提高了应用程序的性能。

## 利用 import() 异步加载
拆分代码的主要方式之一是利用 `import()` 语法动态导入，该语法还只是一个提议，这个提议为 ES 模块增加了一个新特性，允许我们异步地定义代码依赖。

>在不支持 Promise 的老版本浏览器中，需要在网页中增加一个 [es6-promise](https://github.com/stefanpenner/es6-promise) 的 polyfill。

Webpack 根据 ES2015 loader 规范实现了用于动态加载的 `import()` 方法，这个功能可以实现懒加载代码，并且使用了 `Promise` 式的回调，获取加载的包。

在代码中所有被 `import()` 的模块，都将打成一个单独的包，放在 chunk 存储的目录下。在浏览器运行到这一行代码时，就会自动请求这个资源，实现异步加载。

```js
import(/* webpackChunkName: "moment" */ 'moment')
  .then(({ default: moment }) => {
    const tomorrow = moment().startOf('day').add(1, 'day');
    return tomorrow.format('LLL');
  })
  .catch(error => console.error('载入模块时发生错误'))
```

当 webpack 遇到 `import()` 语法时，它会动态创建一个名称为 `moment` 的包

可以看到，`import()` 的语法十分简单，该函数只接收一个参数，就是引用包的地址，这个地址与 es6 的 import 以及 CommonJS 的 `require` 语法用到的地址完全一致，可以实现无缝切换，且使用了 Promise 的封装，开发起来感觉十分自在。

## 异步加载 React 组件

下面的代码会一次性全部发送到浏览器：

```js
import Description from './Description';

function App() {
  return (
    <div>
      <h1>My Movie</h1>
      <Description />
    </div>
  );
}
```

接下来将用这段代码改造成 React 异步组件：

```js
const LoadDescription = () => import('./Description');

class App extends React.Component {
  state = {
    Description: null,
  };

  componentDidMount() {
    LoadDescription.then(Description => {
      this.setState({ Description: Description.default });
    });
  }

  render() {
    const { Description } = this.state;
    return (
      <div>
        <h1>My Movie</h1>
        {Description ? <Description /> : 'Loading...'}
      </div>
    );
  }
}
```

这段代码不复杂，与之前代码相比，组件的加载方式变成了异步加载，当组件异步加载成功时，会更新页面的 `state` ，从而出发页面刷新，刷新后的页面会用 `Description` 组件代替默认的 `Loading...` 文本。

## 用 react-loadable 改进 React 组件加载
React 拥有强大生态圈，已经有人针对上面的代码封装了一个代码拆分的组件——[react-loadable](https://github.com/jamiebuilds/react-loadable)，它提供了一个高阶组件来利用动态加载 React 组件。用 react-loadable 来简化刚才的代码：

```js
import Loadable from 'react-loadable';

const LoadableDescription = Loadable({
  loader: () => import('./Description'),
  loading() {
    return <div>Loading...</div>;
  },
});

function App() {
  return (
    <div>
      <h1>My Movie</h1>
      <LoadableDescription />
    </div>
  );
}
```

这样好多了吧！既然一切看来那么完美，那为什么还需要 `React.lazy` 呢？

`react-loadable` 是以组件为单位工作，每个需要异步加载的组件必须定义自己的加载状态。假如页面上有多个异步加载组件时，用户可能看到满屏都是 loading 图标，这不是最好的用户体验。

## 使用 React.lazy 和 Suspense

在 React 16.6中，通过 `React.lazy()` 和 `React.Suspense` 添加了对基于组件的代码拆分和延迟加载的支持。

>`React.lazy` 和 `Suspense` 暂不支持服务器端渲染，如果你想在一个服务器端渲染的工程中使用代码拆分，推荐你使用 [Loadable Components](https://github.com/smooth-code/loadable-components)，它有一个很好的[使用指南](https://github.com/smooth-code/loadable-components/blob/master/packages/server/README.md)教你如何在服务器端渲染时使用代码拆分。

### react.lazy()
`React.lazy()` 使创建使用动态 `import()` 加载但像常规组件一样呈现的组件变得容易，在组件渲染时，会自动加载包含组件的包。

`React.lazy()` 接受一个函数作为它的参数，该函数必须通过调用 `import()` 来返回一个 `Promise` 来加载组件。返回的 Promise 对象的 resolve 方法接收组件的默认导出的模块。

下面是 `React.lazy()` 的用法：

```js
import React from 'react';

const Description = React.lazy(() => import('./Description'));

function App() {
  return (
    <div>
      <h1>My Movie</h1>
      <Description />
    </div>
  );
}
```

其实上面的代码运行会出错，提示需要添加 `Susponse` 组件：

![图片详情](http://osd.corp.qunar.com/swift/v1/fsh_qtown_blog_fsh_qtown_blog/W0JANzQ3ZWFhZGE=.jpg)

### Suspense
在 `App` 组件渲染的过程中，会触发 `Description` 加载，当 `Description` 还未加载完成时，最好给用户展示一个 loading，这个工作就是 `Suspense` 组件干的。在刚才的代码中加上 `Suspense` ，完整代码如下：

```js
import React, { Suspense } from 'react';

const Description = React.lazy(() => import('./Description'));

function App() {
  return (
    <div>
      <h1>My Movie</h1>
      <Suspense fallback="Loading...">
        <Description />
      </Suspense>
    </div>
  );
}
```

现在通过抓包来验证一下代码拆分结果如何，如下图所示，`JavaScript` 代码被拆到了2个 `js` 文件中：
- `main.js`：主文件
- `0.js`：使用 `React.lazy()` 拆分出来的 `js`

![图片详情](http://osd.corp.qunar.com/swift/v1/fsh_qtown_blog_fsh_qtown_blog/W0JANDBlNDEwM2M=.jpg)

`fallback` 属性接收一个 React 元素，这个元素展示组件加载过程中的 loading 信息。`Suspense` 组件可以是 `React.lazy()` 组件任意一级父组件，也可以在一个 `Suspense` 里多个包含多个 `React.lazy()` 组件，它会捕获所有的 `React.lazy()` 实例并渲染一次 `fallback` ，注意，只渲染一次 `fallback` 。可以将多个异步组件放在同一个 `Suspense` 中，解决前面说的 `react-loadable` loading 太多的问题。

```js
import React, { Suspense } from 'react';
const Description = React.lazy(() => import('./Description'));

function App() {
  return (
    <div>
      <h1>My Movie</h1>
      <Suspense fallback="Loading...">
        <Description />
        <div>
          <span>Cast</span>
          <AnotherLazyComponent />
        </div>
      </Suspense>
    </div>
  );
}

const AndYetAnotherLazyComponent = React.lazy(() =>
  import('./AndYetAnotherLazyComponent')
);

function AnotherLazyComponent() {
  return (
    <div>
      <span>So...so..lazy..</span>
      <AndYetAnotherLazyComponent />
    </div>
  );
}
```

上面的代码虽然一个 `Suspense` 里多个包含多个 `React.lazy()` 组件，但 `Loading...` 会一直显示，直到 `Description` 和 `AnotherLazyComponent` 加载完成。

再来看看当一个 `Susponse` 嵌套另一个 `Susponse` 会怎样：

```js
function App() {
  return (
    <div>
      <h1>My Movie</h1>
      <Suspense fallback="Loading...">
        <Description />
        <div>
          <Suspense fallback="Sorry for our laziness">
            <span>Cast</span>
            <AnotherLazyComponent />
          </Suspense>
        </div>
      </Suspense>
    </div>
  );
}
```

上面的代码是 `Susponse` 嵌套的层级。我运行了这段代码，并录了个视频，视频中包含 `AnotherLazyComponent` 的 `0.js` 延迟了 3 秒才加载。
当 `AnotherLazyComponent` 加载时，可以看到 `Description` 和 `Sorry for our laziness`。这意味着在 `AnotherLazyComponent` 加载过程中，不会影响`Description` 组件渲染。页面会以 `Suspense` 为边界切割成一个个的小区域，每个小区域渲染都是独立的。

![react.lazy](https://raw.githubusercontent.com/zhongzhi107/react-lazy-demo/master/react-lazy.gif)

## 结束语
你可以更新到 React 16.6 来体验 `React.lazy()` 和 `React.Suspense` ，使用它们 React 组件的代码拆分和懒加载变得非常简单。

本文所用的代码可以在 github 下载：
[https://github.com/zhongzhi107/react-lazy-demo](https://github.com/zhongzhi107/react-lazy-demo)

## 相关链接
- [React v16.6.0新特性](https://reactjs.org/blog/2018/10/23/react-v-16-6.html)
- [Use React.lazy and Suspense to Code-Split Your App](https://hswolff.com/blog/react-lazy-and-suspense/)
- [react v16.6 动态 import，React.lazy()、Suspense、Error boundaries](http://www.ptbird.cn/react-lazy-suspense-error-boundaries.html)
- [React code splitting](https://reactjs.org/docs/code-splitting.html)
- [Webpack code splitting](https://webpack.js.org/guides/code-splitting/)
- [react-loadable](https://github.com/jamiebuilds/react-loadable)
