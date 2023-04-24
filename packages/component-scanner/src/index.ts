import { Listr } from 'listr2';
import { chalk, path } from 'zx';
import type { ScanOptions } from './options';
import { callWorker, type ComponentDetail, type Result } from './worker';

/**
 * Export some utilities for conveniently using.
 */
export { chalk, fs, globby, os, path } from 'zx';
export { camelCase, pascalCase, paramCase as kebabCase } from 'change-case';

interface TaskCtx {
  files: string[];
  results: Result[];
  details: ComponentDetail[];
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

  const ctx: TaskCtx = { files: [...files], results: [], details: [] };

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
        ctx.details = await callWorker({
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
    {
      title: 'Applying alias...',
      options: { bottomBar: 1 },
      task: async (ctx, task) => {
        ctx.results = await callWorker({
          exec: 'count-usage',
          namingStyle,
          alias,
          details: ctx.details,
        }, {
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

/**
 * This function has been renamed to `scanComponents`, please use it instead.
 * @deprecated
 */
export const scan: typeof scanComponents = (...args) => {
  console.log(chalk.red('This function has been renamed to `scanComponents`, please use it instead.'));
  return scanComponents.call(this, ...args);
};
