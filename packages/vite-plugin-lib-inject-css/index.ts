import path from 'path';
import fs from 'fs';
import color from 'picocolors';
import MagicString from 'magic-string';
import type { Plugin, LibraryOptions, BuildOptions } from 'vite';

type LibOptions = LibraryOptions & Pick<BuildOptions, 'rollupOptions'>;

const prefix = color.cyan('[vite:lib-inject-css]:');

/**
 * Inject css at the top of each generated chunk file, only works with library mode.
 * @param libOptions Optional libOptions which will overwrite the relevant options.
 */
export function libInjectCss(libOptions?: LibOptions): Plugin {
  let skipInject = false;

  return {
    name: 'vite:lib-inject-css',
    apply: 'build',
    enforce: 'post',
    config() {
      const { rollupOptions, ...lib } = libOptions || {} as LibOptions;
      return {
        build: {
          /**
           * Must enable css code split, otherwise there's only one `style.css` and `chunk.viteMetadata.importedCss` will be empty.
           * @see https://github.com/vitejs/vite/blob/HEAD/packages/vite/src/node/plugins/css.ts#L578-L579
           */
          cssCodeSplit: true,
          rollupOptions,
          lib,
        },
      };
    },
    configResolved(config) {
      if (!config.build.lib) {
        skipInject = true;
        console.log(`\n${prefix} ${color.yellow('Current build is not in lib mode, skip code injection.')}\n`);
      }
    },
    renderChunk(code, chunk) {
      if (skipInject || !chunk.viteMetadata) return;
      const { importedCss } = chunk.viteMetadata;
      if (!importedCss.size) return;

      /**
       * Inject the referenced style files at the top of the chunk.
       * Delegate the task of how to handle these files to the user's build tool.
       */
      const ms = new MagicString(code);
      for (const cssFileName of importedCss) {
        let cssFilePath = path.relative(path.dirname(chunk.fileName), cssFileName);
        cssFilePath = cssFilePath.startsWith('.') ? cssFilePath : `./${cssFilePath}`;
        ms.prepend(`import '${cssFilePath}';\n`);
      }
      return {
        code: ms.toString(),
        map: ms.generateMap(),
      };
    },
  };
}

/**
 * Help to generate lib entry object with similar directory structure.
 * 1. **If it is a file**, use filename without extension as entry name
 * 2. **If it is a directory**, assumes 'src/components', it will scan files under, then use `'src/components/xxx/index'` as entry and `'xxx'` as its name.
 * @param entryDirs directories to scan.
 * @returns lib entry object
 * @example
 * ```javascript
 * scanEntries([
 *   'src/index.ts',
 *   'src/components',
 * ])
 * ```
 */
export function scanEntries(entryDirs: string | string[]) {
  const entries: Record<string, string> = {};
  const counter: Record<string, number> = {};

  for (const entryDir of [entryDirs].flat()) {
    if (!entryDir) break;

    const flattenEntries = fs.statSync(entryDir).isDirectory()
      ? fs.readdirSync(entryDir).map(v => path.resolve(entryDir, v))
      : [entryDir];

    for (const entry of flattenEntries) {
      const { name } = path.parse(entry);
      const entryIndex = counter[name] || 0;
      entries[`${name}${entryIndex || ''}`] = entry;
      counter[name] = entryIndex + 1;
    }
  }

  return entries;
}
