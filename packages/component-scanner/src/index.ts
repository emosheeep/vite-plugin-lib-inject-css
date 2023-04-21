import { Listr } from 'listr2';
import { chalk, path } from 'zx';
import { type Visitor } from './ast-helper';
import { callWorker, type ComponentDetail } from './worker';
import { type NamingStyle, transformNamingStyle } from './utils';

/**
 * Export some utilities for conveniently using.
 */
export { chalk, fs, globby, os, path } from 'zx';
export { camelCase, pascalCase, paramCase as kebabCase } from 'change-case';

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
   * ```js
   * import { a as b, c } from 'my-component-lib';
   * ```
   * If you provide library names, it will **extract the named imports from the lib as a component**.
   * For example, in the case above, `a` and `c` will be accepted, `b` is only an alias of `a`, which will be abandoned.
   */
  libraryNames?: string[];
  /**
   * This helps to format the extracted component names.
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
   * @example
   * ```js
   * {
   *   alias: {
   *     'custom-button': 'a-button', // The custom-button will be treated as a-button
   *   }
   * }
   * ```
   * The key and value will be transformed according to the namingStyle.
   */
  alias?: Record<string, string>;
}

interface Result extends ComponentDetail {
  usage: Record<string, number>;
}

interface TaskCtx {
  files: string[];
  results: Result[];
}

const globPattern = '**/*.{js,ts,jsx,tsx,vue,mjs,cjs}';

const logger = {
  info: (...args) => console.log(chalk.blue('info'), ...args),
  warn: (...args) => console.log(chalk.yellow('warn'), ...args),
  error: (...args) => console.log(chalk.red('error'), ...args),
};

export async function scanComponents(options?: ScanOptions) {
  let {
    cwd = process.cwd(),
    ignore = [],
    files = [],
    libraryNames,
    visitors,
    namingStyle,
    verbose = true,
    alias = {},
  } = options || {};

  ignore = [...new Set([...ignore, '**/node_modules/**'])];
  alias = Object.fromEntries(
    Object.entries(alias).map(arr =>
      arr.map(name => transformNamingStyle(name, namingStyle)),
    ),
  );

  if (verbose) {
    logger.info(`Working directory is ${chalk.underline.cyan(cwd)}`);
    logger.info(`Ignored paths: ${ignore.map(v => chalk.yellow(v)).join(',')}`);
  }

  // Make paths absolute.
  files = files.map(filename =>
    path.isAbsolute(filename)
      ? filename
      : path.resolve(cwd, filename),
  );

  const ctx: TaskCtx = { files: [...files], results: [] };

  const runner = new Listr<TaskCtx>([
    {
      title: `Globbing files with ${chalk.underline.cyan(globPattern)}`,
      skip: ctx => ctx.files.length
        ? `Received ${chalk.cyan(files.length)} files, skip to glob files.`
        : false,
      task: async (_, task) => task.newListr([{
        title: 'Wait a moment...',
        task: async (ctx, task) => {
          const files = await callWorker({
            exec: 'glob-files',
            pattern: globPattern,
            cwd,
            ignore,
          });
          task.title = `${chalk.cyan(files.length)} files were detected.`;
          ctx.files = files;
        },
      }]),
    },
    {
      title: 'Extracting component names from files...',
      options: { bottomBar: 1 },
      task: async (ctx, task) => {
        ctx.results = await callWorker({
          exec: 'scan-component',
          cwd,
          files: ctx.files,
          libraryNames,
          namingStyle,
        }, {
          ...visitors,
          onProgress(filename, index, total) {
            task.output = `${index + 1}/${total} - ${filename}`;
          },
        }) as Result[];
      },
    },
    {
      title: 'Applying alias...',
      options: { bottomBar: 1 },
      task: async (ctx, task) => {
        const { length } = ctx.results;
        const results: Result[] = [];
        for (let i = 0; i < length; i++) {
          const detail = ctx.results[i];
          task.output = `${i + 1}/${length} - ${detail.filename}`; // print process
          const usage: Result['usage'] = {};
          for (let j = detail.components.length - 1; j >= 0; j--) {
            const name = detail.components[j];
            const realName = alias[name] ?? name; // replace aliased name with real name.
            usage[realName] = (usage[realName] ?? 0) + 1;
          }
          // filter empty results
          const names = Object.keys(usage);
          if (names.length) {
            results.push({
              ...detail,
              usage,
              components: names,
            });
          }
        }
        ctx.results = results;
      },
    },
  ], {
    // @ts-ignore
    renderer: verbose ? 'default' : 'silent',
    rendererOptions: {
      showTimer: true,
      collapse: false,
    },
  });

  await runner.run(ctx);

  return ctx.results;
}

/**
 * This function has been renamed to `scanComponents`, please use it instead.
 * @deprecated
 */
export const scan: typeof scanComponents = (...args) => {
  console.log(chalk.red('This function has been renamed to `scanComponents`, please use it instead.'));
  return scanComponents.call(this, ...args);
};
