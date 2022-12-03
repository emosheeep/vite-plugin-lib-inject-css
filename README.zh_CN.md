# circular dependencies scanner ⚡

<div style="display: flex;">
  <a href="https://npmjs.com/package/circular-dependency-scanner">
    <img src="https://img.shields.io/npm/v/circular-dependency-scanner" alt="npm package">
  </a>
  <img src="https://img.shields.io/npm/dt/circular-dependency-scanner" alt="npm downloads">
  <img src="https://img.shields.io/npm/l/circular-dependency-scanner" alt="npm downloads">
  <img src="https://img.shields.io/bundlephobia/minzip/circular-dependency-scanner" alt="package size">
</div>

开箱即用的 Vite MPA插件 📦，支持HTML模板引擎和虚拟文件功能，能够使用一份模板生成多个文件。

[English](./README.md) | 中文

## 主要功能

- 💡 EJS 模板渲染
- 💡 完备的 TypeScript 类型提示支持，是一款小而美的插件
- 🛠️ 自定义模板HTML文件的输出路径, 使用一份模板生成多份文件
- 🛠️ MPA 多页面应用支持，提供 History Fallback API.

## 插件对比

使用vite开发构建 **多页面应用(MPA)** 的时候，我们通常需要一个具备以下能力的插件：

1. 具备模板引擎如ejs，能够使用一个模板生成多份文件，且能自定义构建时生成文件的路径。

2. 自动配置 `rollupOptions.input`，并提供能力配置开发服务器的代理（主要是history fallback api）。

市面上有非常多的关于vite的MPA插件，但他们却几乎没有能同时做到以上两点的。根据名称匹配度和下载量，我筛选到以下插件:

1. [vite-plugin-mpa](https://github.com/IndexXuan/vite-plugin-mpa)：可以自动配置入口，并提供开发服务器代理配置入口（fallback rule），但必须按照约定调整目录结构，且不支持模板引擎和虚拟入口，也无法定义生成文件的路径。

2. [vite-plugin-html-template](https://github.com/IndexXuan/vite-plugin-html-template)：这个插件的作者和vite-plugin-mpa是同一个人，算是作者推荐的配套插件，主要是和mpa插件组合使用以提供模板引擎功能，同样不支持虚拟入口。

3. [vite-plugin-html](https://github.com/vbenjs/vite-plugin-html)：只支持模板引擎，且不支持虚拟入口。

4. [vite-plugin-virtual-html](https://github.com/windsonR/vite-plugin-virtual-html)：支持虚拟入口，提供了渲染接口，可以定制模板引擎。但没有内置模板引擎，用起来有点麻烦还是。

其中，**"虚拟入口"** 的意思是，通过一个模板文件，渲染出多个入口html文件。

其他插件大同小异，他们各有所长，但用起来总不趁手。要么需要搭配使用，要么对现有项目结构的改动较多。有时候我也好奇，既然实现了模板引擎，却又需要多个模板文件，这样做岂不是失去了模板的优势。

而这个插件便是为了解决这些问题，它同时具备上面提到的所有能力。通过结合虚拟入口和模板引擎，使得用户只需要一份模板就可以生成不同的入口html，且能自定义入口文件的输出路径（再也不用手动写脚本移动了！）。同时也提供了接口为开发服务器配置rewrite rules，以便开发时能够正确地请求到入口文件。

如果你的项目正在使用vite工作流且为MPA应用，不妨尝试一下这个插件，它不限制技术栈，与你是否使用vue还是react或其他技术无关。

## 使用方式

```sh
pnpm add -D circular-dependency-scanner # or npm/yarn
```

```ts
// vite.config.ts
import { createMpaPlugin } from 'circular-dependency-scanner'

// @see https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    createMpaPlugin({
      pages: [
        // your configuration
      ]
    }),
  ],
})
```

## Options

```ts
type FilterPattern = string | RegExp | (string | RegExp)[]
interface WatchHandler {
  (ctx: {
    server: ViteDevServer,
    file: string,
    type: Event
    /**
     * 可以调用这个方法更新页面配置
     * @params pages MPA 页面核心配置，这将会替换默认的 `pages`
     */
    reloadPages: (pages: Page[]) => void
  }): void
}

interface MpaOptions {
  /**
   * 是否在控制台打印log
   * @default true
   */
  verbose?: boolean,
  /**
   * 默认模板文件
   * @default index.html
   */
  template?: `${string}.html`,
  /**
   * 配置fallback rewrite rules，只会处理accept=text/html的文件请求
   * 详见: https://github.com/bripkens/connect-history-api-fallback
   */
  rewrites?: Rewrite[],
  /**
   * 当项目目录下有一些文件触发相应的事件如添加、删除、修改时，你可能想要重新加载 `pages` 配置 或 重启 ViteDevServer。
   * 你可以通过设置 `watchOptions` 来实现这一目的。
   */
  watchOptions?: WatchHandler | {
    /**
     * 指定需要**包含**的文件，基于 `Rollup.createFilter` 过滤
     * @see https://vitejs.dev/guide/api-plugin.html#filtering-include-exclude-pattern
     */
    include?: Exclude<FilterPattern, null>,
    /**
     * 指定需要**排除**的文件，基于 `Rollup.createFilter` 过滤
     * @see https://vitejs.dev/guide/api-plugin.html#filtering-include-exclude-pattern
     */
    excluded?: Exclude<FilterPattern, null>,
    /**
     * 想要监听的文件事件
     * @default ['add', 'unlink', 'change', 'unlinkDir', 'addDir']
     */
    events?: Event[],
    /**
     * 定义的文件事件触发后，执行自定义逻辑
     */
    handler: WatchHandler
  },
  pages: Array<{
    /**
     * 必填。该名称是一个不包含'/'的普通字符串，它用于生成默认的重定向规则。
     * 如果你想自定义生成文件的路径，请使用filename选项，而不是name选项。
     */
    name: string;
    /**
     * 相对于`build.outDir`的路径，应该以html结尾
     * @default `${name}.html`
     */
    filename?: `${string}.html`;
    /**
     * 更高优先级的模板文件，将会覆盖默认模板
     */
    template?: string;
    /**
     * 自动注入入口文件，如果设置了entry，需要移除模板文件中的entry
     */
    entry?: string;
    /**
     * 注入到模板文件的数据
     */
    data?: Record<string, any>,
  }>
}
```
## Examples

点击链接 [codesandbox](https://codesandbox.io/s/circular-dependency-scanner-0djylc) 快速体验

```ts
// vite.config.ts
import { normalizePath } from "vite";
import { createMpaPlugin } from "circular-dependency-scanner"

const base = "/sites/"

// @see https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [
    createMpaPlugin({
      pages: [
        {
          name: "apple",
          /**
           * 文件名是可选的，默认将会是`${name}.html`，这个路径是相对于`build.outDir`
           */
          filename: "fruits/apple.html", // 将会在编译时输出到sites/fruits/apple.html
          entry: "/src/fruits/apple/apple.js",
          data: {
            title: "This is Apple page"
          }
        },
        {
          name: "banana",
          filename: "fruits/banana.html",
          entry: "/src/fruits/banana/banana.js",
          data: {
            title: "This is Banana page"
          }
        },
        {
          name: "strawberries",
          filename: "fruits/strawberries.html",
          entry: "/src/fruits/strawberries/strawberries.js",
          data: {
            title: "This is Strawberries page"
          }
        }
      ],
      /**
       * 通过该选项rewrites来配置history fallback rewrite rules
       * 如果你像上面这样配置页面的话，那下面的这份配置将会自动生成。
       * 否则你需要自己编写重定向规则，自定义规则将覆盖默认规则。
       */
      rewrites: [
        {
          from: new RegExp(normalizePath(`/${base}/(apple|banana|strawberries)`)),
          to: (ctx) => normalizePath(`/fruits/${ctx.match[1]}.html`),
        }
      ],
    }),
  ],
})
```

## 默认重定向规则

正如上面提到的👆🏻，如果你的配置遵循约定，插件将会自动生成一份重定向规则，如下：
```ts
{
  from: new RegExp(normalizePath(`/${base}/(${Object.keys(inputMap).join('|')})`)),
  to: ctx => normalizePath(`/${inputMap[ctx.match[1]]}`),
}
```

其中, **inputMap** 是一个`name`到对应虚拟文件的映射，结构如下:

```ts
{
  apple: 'fruits/apple.html',
  banana: 'fruits/banana.html',
  strawberries: 'fruits/strawberries.html',
}
```

请求Url`/sites/apple/xxx`将会被**默认重定向规则**处理并重定向到对应的url，也就是`/fruits/apple.html`(name `'apple'` 对应 `'fruits/apple.html'`, 其他同理)，重定向后的路径将会基于`viteConfig.base(这里是'/sites/')`去寻找目标文件，所以最终的Url会变成`/sites/fruits/apple.html`.

## 关于虚拟入口文件

通常在开发时，我们的文件都是写在本地的，我们通过DevServer的代理能够通过url访问到本地对应的文件。虚拟文件也是如此，只不过对应的文件没有写到文件系统中，而是保存在内存中而已。

该插件通过模板系统生成了对应的虚拟文件，让你可以在开发时**通过代理访问到内存中的虚拟文件**，并在构建时生成到对应的目录下。

你完全可以认为这些虚拟文件是真实存在的，这将有助于你在脑海中构建关于虚拟文件的直觉，以便能够正确地编写代理配置。
