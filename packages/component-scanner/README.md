# component-scanner

<div style="display: flex;">
  <a href="https://npmjs.com/package/component-scanner">
    <img src="https://img.shields.io/npm/v/component-scanner" alt="npm package">
  </a>
  <img src="https://img.shields.io/npm/l/component-scanner" alt="npm license">
</div>

Cross-framework and simple web system component scanner, support `vue`(`html`, `pug` template), `react`, `jsx`, `tsx`, help counting component usage.

# Motivation

This tool helps you refactor you inner business component library in company working.

Generally speaking, we work in multiple projects and they may use same components. You probably extract the components into a inner business component library, and introduce them from it.

Someday you want to refactor whether lib building process or component logic, but you don't know where're the components used in projects, which is not good for our regression tests, especially when the lib is introduced by lots of large projects.

**In this case, this tool makes significant sense**. This is the main problem this tool is designed to solve. As for the other usage, you can freely play it.

# How it works

By AST analysis we can almost do whatever we want, this is one of things we can do.

In the most of situations we think of `html`, `pug`'s tag name, `JSXElement` 's tag name as a component name, and extract them as statistical results.

But there are still some special cases that:

1. `h` is a name convention that means render function in vue.
2. `this.$createElement` expression means the same in vue.

The first argument of these two function represents a component in common, especially when it is a string literal.

Sometimes we also consider the named imports as a component name. If you provide library names, it will **extract the named imports from the lib as a component**.

For example:

```js
import { a as b, c } from 'my-component-lib';
```

In the case above, `a` and `c` will be accepted, `b` is only an alias of `a`, which will be abandoned.

# Usage

```sh
pnpm add component-scanner # or npm/yarn
```


```js
import { scanComponents } from 'component-scanner';

const result = await scanComponents(); // use default options, glob and handle files under current working directory.

const result = await scanComponents({
  namingStyle: 'kebab-case',
  verbose: true, // whether to print log.
  cwd: process.cwd(), // default is current working directory.
  files: [], // specify files to handle.
  ignore: [
    '**/node_modules/**', // node_modules is always ignored.
    '**/dist/**',
    '**/output/**',
  ],
  // will count named imports from these lib.
  libraryNames: [
    'antd',
    'antd-design-vue',
    'my-component-lib',
  ],
  // manually count component by these hooks.
  visitors: {
    onTag: tagName => {}, // html,pug,JSXElement,h,this.$createElement
    onImport: importInfo => {}, // fires when libraryNames are provided.
  },
  alias: {
    'my-button': 'a-button', // my-button is a wrapped component of a-button, setting alias configs helps count a-button's usage.
  }
})
```

And then, you'll get `Result[]`:

```ts
interface Result {
  filename: string;
  component: string[];
  usage: Record<string, number>;
}

const result: Result = {
  filename: 'src/modules/list/pages/tag/TagGroup.vue',
  components: [
    'byted-link',
    'template',
    'icon',
    'byted-button',
    'oplog-drawer',
    'page-layout',
    'audit-form',
    'add-form'
  ],
  usage: {
    'byted-link': 1,
    template: 2,
    icon: 1,
    'byted-button': 1,
    'oplog-drawer': 1,
    'page-layout': 1,
    'audit-form': 1,
    'add-form': 1
  }
}
```

## Some Utilities

This tool export some utilities used inside from [zx](https://www.npmjs.com/package/zx) and [change-case](https://www.npmjs.com/package/change-case), which may help you customize your logic conveniently.

```ts
export { chalk, fs, globby, os, path } from 'zx';
export { camelCase, pascalCase, paramCase as kebabCase } from 'change-case';
```

# Example

There's a vue file like:

```vue
<template lang="pug">
  AButton(@click="onClick")
    a-icon
  empty-box
</template>

<script setup lang="tsx">
import { message } from 'ant-design-vue';
import { MyEmptyBox as EmptyBox } from 'my-component-lib'
import { h, defineComponent } from 'vue';

const MyComponent = defineComponent({});
const MyButton = defineComponent({});

function onClick() {
  message.success({
    content: h('span', [
      h(MyButton),
      this.$createElement('div'),
      <MyComponent>
        <EmptyBox />
      </MyComponent>
    ]);
  })
}
</script>
```

This file is only for example, we can get `message`, `my-empty-box`, `empty-box`, `my-component`, `my-button`, `span`, `div` `a-button`, `a-icon` from the file by component analysis. And then, you can manually handle the results.

# Options

```ts
interface Visitor {
  /** Handle component name from template and jsx */
  onTag(name: string): void;
  /** Handle import specifiers */
  onImport(value: ImportParam): void;
}

export interface ScanOptions {
  /**
   * Customize visitors to get components from provided files.
   */
  visitors?: Visitor;
  /**
   * Files to handle.
   * If don't received, it matches js,ts,jsx,tsx,vue,mjs,cjs files under current working directory.
   */
  files?: string[];
  /**
   * Base path to execute command.
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Glob patterns to exclude from matches.
   * `node_modules` is always ignored.
   */
  ignore?: string[];
  /**
   * Library names to filter components.
   * Sometimes we import a component directly from a lib like:
   * If you provide library names, it will **extract the named imports from the lib as a component**.
   * For example, in the case above, `a` and `c` will be accepted, `b` is only an alias of `a`, which will be abandoned.
   */
  libraryNames?: string[];
  /**
   * This helps formatting the extracted component names.
   * @default 'default'
   */
  namingStyle?: NamingStyle;
  /**
   * Whether to print log.
   * @default true
   */
  verbose?: boolean;
  /**
   * Sometimes you probably wrap a component from the library and use it in many places.
   * You can set alias for these component so that their usage can be counted more exact.
   */
  alias?: Record<string, string>
}
```

# Issue

We made some compatibility about vue, the detailed reasons is above. **Sometimes it impacts accuracy, probably appears some unexpected components**.

But we consider that **it should extract component names as much as possible**. Redundant component names can be ignored by some ways, but it probably cause some exceptions if we missed some component name in regression tests.

**If you have an edge case, welcome to PR or file an issue**.

# License

[MIT](./LICENSE) License © 2023 [秦旭洋](https://github.com/emosheeep)
