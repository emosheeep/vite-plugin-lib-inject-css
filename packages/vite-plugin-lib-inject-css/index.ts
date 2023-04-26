import path from 'path';
import fs from 'fs';
import color from 'picocolors';
import MagicString from 'magic-string';
import type { Plugin, LibraryOptions, BuildOptions } from 'vite';

export interface LibOptions extends LibraryOptions {
  build?: BuildOptions
  rollupOptions?: BuildOptions['rollupOptions'];
}

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
      const { rollupOptions = {}, build, ...lib } = libOptions || {} as LibOptions;

      let outputOptions = rollupOptions.output;
      outputOptions = [outputOptions].flat().map(options => ({
        /**
         * By default, when creating multiple chunks, transitive imports of entry chunks will be added as empty imports to the entry chunks.
         * @see https://rollupjs.org/faqs/#why-do-additional-imports-turn-up-in-my-entry-chunks-when-code-splitting
         * But as a library, this option may cause tree-shaking fails, so we set `false` here as default behavior.
         */
        hoistTransitiveImports: false,
        ...options,
      }));

      // preserve vite's default behavior
      rollupOptions.output = Array.isArray(outputOptions)
        ? outputOptions[0]
        : outputOptions;

      return {
        build: {
          ...build,
          lib,
          rollupOptions,
          /**
           * Must enable css code split, otherwise there's only one `style.css` and `chunk.viteMetadata.importedCss` will be empty.
           * @see https://github.com/vitejs/vite/blob/HEAD/packages/vite/src/node/plugins/css.ts#L578-L579
           */
          cssCodeSplit: true,
        },
      };
    },
    configResolved({ build }) {
      const messages: string[] = [];
      const outputOptions = [build.rollupOptions.output].flat();

      if (!build.lib) {
        skipInject = true;
        messages.push('Current build is not in library mode, skip code injection.');
      }

      if (build.lib && build.cssCodeSplit === false) {
        messages.push(
          '`config.build.cssCodeSplit` is set `true` by the plugin internally in library mode, ' +
              'but it seems to be `false` now. This may cause style code injection fail, ' +
                'please check the configuration to prevent this option from being modified.',
        );
      }

      const createPreserveModulesWarning = (optionPath: string) => {
        messages.push(
          'When `' + optionPath + '` is `true`, ' +
          'the association between chunk file and its css references will lose, ' +
          'so the style code injection will be skipped.',
        );
      };

      if (outputOptions.some(v => v?.preserveModules === true)) {
        skipInject = true;
        createPreserveModulesWarning('rollupOptions.output.preserveModules');
      }

      if (build.rollupOptions.preserveModules === true) {
        skipInject = true;
        createPreserveModulesWarning('rollupOptions.preserveModules');
      }

      messages.forEach(msg => console.log(`\n${color.cyan('[vite:lib-inject-css]:')} ${color.yellow(msg)}\n`));
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
