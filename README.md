暖枫是二次元风格，生活记录应用，包含手帐式排版，温柔的治愈文案，专注与呼吸练习，食物营养记录，倒数日等模块。



技术栈：Next.js 加 React 框架；React 19 加 TypeScript。Tailwind CSS。
Capacitor 用于打包成安卓应用，离线本地运行。数据全部存于浏览器或应用本地，无后端，无账号，无云同步。

本地运行网页版只需 Node.js，建议 LTS 版本，不需要安卓环境。

安装依赖必须用 npm install --legacy-peer-deps，因为 react-roughviz 的 peer 依赖只认 React 16，普通 npm install 会报错。启动开发服务器用 npm run dev，打开 http://localhost:3000 即可预览。
构建生产版本用 npm run build，再用 npm run start。

打包成安卓应用是可选步骤，比重网页版重很多，需要 Android Studio 加 JDK 21 加一个签名 keystore。普通体验或看代码不需要这步。

首次需执行 npx cap add android 生成安卓工程，再执行 npm run cap:sync 把网页同步进安卓工程，然后用 Android Studio 打开 android 目录，或执行 npm run apk:debug 出调试包，执行 npm run apk:release 出正式包，正式包需要你自己的签名 keystore。注意 android 目录默认不在 git 里，它是 cap sync 生成出来的原生工程，贡献者本地重新生成即可。

目录结构简要如下。app 是 Next.js 入口。components 是界面组件，单页应用用 nav 切换各页面。lib 是工具与数据逻辑，含营养计算，食物库，脑图等。public 是静态资源，含中国食材数据 china-foods.json。hooks 是 React 钩子。

许可证采用知识共享署名非商业性使用 4.0 国际许可协议，即 CC BY-NC 4.0。
可以复制，分发，修改，免费公开使用。可以基于本项目创作衍生作品。不得用于商业目的，即主要意在或指向商业优势与金钱报酬的使用。使用时必须署名，注明原作者与本项目。

这是个人项目，作者因为学业问题不会继续更新此软件。如果你想 Fork 自己改着玩完全没问题，请遵守上面的非商业许可。
