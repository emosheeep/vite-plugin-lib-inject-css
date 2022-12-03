# circular dependencies scanner ⚡

<div style="display: flex;">
  <a href="https://npmjs.com/package/circular-dependency-scanner">
    <img src="https://img.shields.io/npm/v/circular-dependency-scanner" alt="npm package">
  </a>
  <img alt="Publish Package" src="https://github.com/emosheeep/circular-dependency-scanner/actions/workflows/npm-publish.yml/badge.svg">
  <img src="https://img.shields.io/npm/dt/circular-dependency-scanner" alt="npm downloads">
  <img src="https://img.shields.io/npm/l/circular-dependency-scanner" alt="npm downloads">
  <img src="https://img.shields.io/bundlephobia/minzip/circular-dependency-scanner" alt="package size">
</div>

Out-of-box and zero configuration circular dependencies detector 📦, with both JavaScript API and Command Line Tool.

English | [中文](./README.zh_CN.md)

# Features

- 💡 Friendly Command Line Tool.
- 🛠️ Fully Typed JavaScript APIs and Prompts.
- 🌩 Tiny, Pretty, Fast and Reliable.

# Motivation

On one hand there are few tools, on the other hand there are too many annoyed problems among the exist tools on the market:

1. Not reliable, **usually missed lots of dep-circles**. This is because in common they can't pull out the import/require sources correctly from source files
2. Not a standalone tool, they often appears as a webpack/rollup/vite plugin, and analyze the relations with help of the module graph created by the plugin's host, which usually under limitations, slow and hard to use.

But now, you just run `ds`, all of the **(.js,.jsx,.ts,.tsx,.mjs,.cjs,.vue)** files under current directory will be parsed directly and fast with TypeScript API, which almost include all file types we used. And then the circles among these files will be printed.

# Command Line Tool (Prefer)

The `ds` command will be available after you installed this package globally.

```sh
pnpm i -g circular-dependency-scanner # or npm/yarn
cd path/to/execute # change directory
ds # run `ds` command
```

There are detailed documentations built in, you can use `-h` option to print help information anytime.

```sh
ds [options] [path] # Automatically detect circular dependencies under the current directory and print the circles.
```

## Options

```sh
ds -h # print help info
ds -V/--version # print cli version

ds # current dir by default
ds src # detect src directory...and so on.
ds --filter 'src/router/*.ts' # only print the circles matched the pattern.
ds --absolute # print absolute path.
ds --ignore output dist node_modules # path to ignore.
ds --alias @:src @components:src/components # path alias, follows `<from>:<to>` convention
```

## Snapshot

The `ts,js,vue` files will be printed as `blue,yellow,green` as follows:

<img alt="output-snapshot" src="./snapshots/output.png" width="600" />

# JavaScript API

Sometime you may want to manually write script and make an analysis, just use JavaScript API as follows:

```ts
import { circularDepsDetect } from 'circular-dependency-scanner';

const results = circularDepsDetect({
  /**
   * Base path to execute command.
   * @default process.cwd()
   */
  cwd: string;
  /**
   * Whether to use absolute path.
   * @default false
   */
  absolute: boolean;
  /**
   * Glob patterns to exclude from matches.
   * @default ['node_modules']
   */
  ignore: string[];
  /**
   * Path alias to resolve.
   * @default { '@': 'src' }
   */
  alias: Record<string, string>;
});

```

# Which reference will be pull out from the files

This source code is here [src/ast.ts](https://github.com/emosheeep/circular-dependency-scanner/blob/HEAD/src/ast.ts). In a short, it find reference like: 

```ts
import test from './test'; // got './test'
import './test'; // got './test'
import('./test'); // got './test'
require('./test'); // got './test'
export * from './test'; // got './test'
export { test }; // got no export source
```

If some of the circles it found make no sense, you can use `--filter` option to screen out.

# Reference

- The Command Line Tool is based on [commander](https://github.com/tj/commander.js).
- The circular dependencies analysis algorithm is based on [graph-cycles](https://github.com/grantila/graph-cycles).

# Issues

No tool is perfect, and if you run into problems with it, welcome to file an issue, I’ll respond as soon as possible.