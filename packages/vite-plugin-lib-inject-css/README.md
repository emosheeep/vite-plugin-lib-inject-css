# vite-plugin-lib-inject-css

<div style="display: flex;">
  <a href="https://npmjs.com/package/vite-plugin-lib-inject-css">
    <img src="https://img.shields.io/npm/v/vite-plugin-lib-inject-css" alt="npm package">
  </a>
  <img src="https://img.shields.io/npm/l/vite-plugin-lib-inject-css" alt="npm license">
</div>

English | [简体中文](https://juejin.cn/post/7214374960192782373)

Inject css at the top of each chunk file in lib mode using `import` statement like this:

```js
// bundled js file, with import css at top (if any)
import './style.css';
// rest of the file
// ...
```

> **Can css be styleInjected in library mode**? [vite#1579](https://github.com/vitejs/vite/issues/1579).

# Features

Note that this plugin only works with [library-mode](https://vitejs.dev/guide/build.html#library-mode).

- 💡 Multiple entires support.
- ⚡️ Sourcemap support.
- 🛠 Out-of-box, tiny and pretty.

# Usage

Install:


```shell
pnpm i vite-plugin-lib-inject-css -D # npm/yarn
```

Config:

```js
// vite.config.ts
import { libInjectCss, scanEntries } from 'vite-plugin-lib-inject-css';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    libInjectCss(), // For a simple usage
    // Parameters are optional, which is only an alias, aim to make configs concise.
    libInjectCss({
      format: ['es'],
      entry: {
        index: 'src/index.ts', // Don't forget the main entry!
        button: 'src/components/button/index.ts',
        select: 'src/components/select/index.ts',
        // Uses with a similar directory structure.
        ...scanEntries([
          'src/components',
          'src/hooks',
        ])
      },
      rollupOptions: {
        output: {
          // Put chunk files at <output>/chunks
          chunkFileNames: 'chunks/[name].[hash].js',
          // Put chunk styles at <output>/styles
          assetFileNames: 'assets/[name][extname]',
        },
      },
    }),
  ],
})
```

# Motivation

Vite shines in Web project development, but it can also be used for library projects.

But when it comes to component library development, multiple entries are often involved. Although `Vite 3.2+` later supports multiple entry points, it doesn't provide relevant options for us to associate css with component, which leads to the problem that we can't distinguish between the entry point and css files even though the bundle is successful. 
 
Based on this, we need to write a plugin to try to find the relationship between the two, and inject styles correctly.

# How does it work

As a library(mostly component library), we want to import styles automatically when referencing the component.

```js
/** component-lib/dist/button.js */
import './assets/button.css'; // This is what this plugin do;
...
export default Button;

/** component-lib/dist/index.js */ 
import Button from './button.js';
import xxx from './xxx.js';
export { Button, xxx };
...

/** In our project's main file */
// Once we import Button, styles'll be imported together.
import { Button } from 'component-lib';
```

The simplest way is to add a line `import './style.css';`; to the top of the generated file, multiple lines are multiple lines. As a library provider, we should **provide flexibility as much as possible**, and **delegate the task of how to handle these css files to the user's build tool**.

But most of the Vite plugins on the market that claim to automatically inject CSS are designed in a way use `document.createElement ('style')`, which is not graceful, and it assumes that the current is in the Browser's DOM environment.

So the main problem becomes to **how do we know which style files are involved in one chunk file?**.

In fact, vite adds a property named [`viteMetadata`](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/css.ts#L578-L579) on each chunk file in plugin lifecycle, 
we can get which resource files(include CSS files) are associated with current chunk file by using this property.

Based on these, we can inject styles by using plugin hook [renderChunk](https://rollupjs.org/plugin-development/#renderchunk), which is the simplest and most effective way.

Prefer to check source code to get more information.

# Recipes

How do we create a component library with vite, which can auto import styles and has out-of-box tree-shaking functionality?

## Current Status

Most of component libraries provide two ways. One is totally import:

```js
import Vue from 'vue';
import XxxUI from 'component-lib';
Vue.use(XxxUI);
```

The other is import on demand, in common uses with a third-part plugin like `babel-plugin-import`:

```js
import { Button } from 'component-lib';
// ↓ ↓ ↓ transformed ↓ ↓ ↓
import Button from 'component-lib/dist/button/index.js'
import 'component-lib/dist/button/style.css'
```

**But the best way is that when we use named imports, the style imports and tree-shaking can be completed automatically**.

## How should we do

Fortunately, ES Module naturally has static analysis capabilities, and mainstream tools basically implement ESM-based Tree-shaking functions, such as `webpack/rollup/vite`.

Then we only need the following two steps:
- Adjust the output format to ES Module → Out-of-the-box Tree-shaking functionality.
- Use this plugin for style injection → auto import styles

It should be noted that the import of CSS files has side effects, and we also need to **declare the [sideEffects](https://webpack.js.org/guides/tree-shaking) field in the library's package.json file** to prevent the CSS file from being accidentally removed by the user side builds.

Here's an example:

```json
{
  "name": "component-lib",
  "version": "1.0.0",
  "main": "dist/index.mjs",
  "sideEffects": [
    "**/*.css"
  ]
}
```

# License

[MIT](./LICENSE) License © 2023 [秦旭洋](https://github.com/emosheeep)