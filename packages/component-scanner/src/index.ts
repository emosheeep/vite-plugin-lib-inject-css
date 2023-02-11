import { Listr } from 'listr2';
import { chalk, path } from 'zx';
import { type Visitor } from './ast-helper';
import { callWorker, NamingStyle } from './worker';

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
   * This helps formatting the extracted component names.
   * @default 'default'
   */
  namingStyle?: NamingStyle;
  /**
   * Whether to print log.
   * @default true
   */
  verbose?: boolean
}

interface TaskCtx {
  files: string[];
  results: string[];
}

const globPattern = '**/*.{js,ts,jsx,tsx,vue,mjs,cjs}';

const logger = {
  info: (...args) => console.log(chalk.blue('info'), ...args),
  warn: (...args) => console.log(chalk.yellow('warn'), ...args),
  error: (...args) => console.log(chalk.red('error'), ...args),
};

export async function scan(options?: ScanOptions) {
  let {
    cwd = process.cwd(),
    ignore = [],
    files = [],
    libraryNames,
    visitors,
    namingStyle,
    verbose = true,
  } = options || {};

  ignore = [...new Set([...ignore, '**/node_modules/**'])];

  if (verbose) {
    logger.info(`Working directory is ${chalk.underline.cyan(cwd)}`);
    logger.info(`Ignored paths: ${ignore.map(v => chalk.yellow(v)).join(',')}`);
  }

  // Absolutize the paths.
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
        });
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
