import { Listr, PRESET_TIMER } from 'listr2';
import { minimatch } from 'minimatch';
import { chalk, path } from 'zx';
import { type TsConfigResult, getTsconfig } from 'get-tsconfig';
import { type Edge, type FullAnalysisResult } from 'graph-cycles';
import { logger } from './logger';
import { extensions } from './utils';
import { callWorker } from './worker';

export interface DetectOptions {
  /**
   * Base path to execute command.
   * @default process.cwd()
   */
  cwd?: string;
  /**
   * Whether to use absolute path.
   * @default false
   */
  absolute?: boolean;
  /**
   * Glob patterns to exclude from matches.
   * @default ['node_modules']
   */
  ignore?: string[];
  /**
   * Glob pattern to filter output circles.
   * @default ['node_modules']
   */
  filter?: string;
}

interface TaskCtx {
  files: string[];
  entries: Edge[];
  result: FullAnalysisResult['cycles'];
}

/**
 * Detect circles among dependencies.
 */
export async function circularDepsDetect(
  options?: DetectOptions,
): Promise<string[][]> {
  let {
    cwd = process.cwd(),
    ignore = [],
    absolute = false,
    filter,
  } = options || ({} as DetectOptions);

  /* ----------- Parameters pre-handle start ----------- */

  ignore = [...new Set([...ignore, '**/node_modules/**'])];

  /* ------------ Parameters pre-handle end ------------ */

  const globPattern = `**/*.{${extensions.join(',')}}`;

  logger.info(
    `Working directory is ${chalk.underline.cyan(path.resolve(cwd))}`,
  );
  logger.info(`Ignored paths: ${ignore.map((v) => chalk.yellow(v)).join(',')}`);

  const tsconfig = [
    'tsconfig.json',
    'jsconfig.json',
  ].reduceRight<TsConfigResult | null>(
    (config, filename) => config ?? getTsconfig(cwd, filename),
    null,
  );

  if (tsconfig?.config.compilerOptions?.paths) {
    logger.info(`Config file detected: ${chalk.cyan(tsconfig.path)}`);
  }

  const ctx: TaskCtx = { entries: [], result: [], files: [] };

  const runner = new Listr<TaskCtx>(
    [
      {
        title: `Globbing files with ${chalk.underline.cyan(globPattern)}`,
        task: async (_, task) =>
          task.newListr([
            {
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
            },
          ]),
      },
      {
        title: 'Pulling out import specifiers from files...',
        rendererOptions: { bottomBar: 1 },
        task: async (ctx, task) => {
          ctx.entries = await callWorker(
            {
              exec: 'pull-out',
              cwd,
              absolute,
              tsconfig,
              files: ctx.files,
            },
            {
              onProgress(filename, index, total) {
                task.output = `${index + 1}/${total} - ${filename}`;
              },
            },
          );
        },
      },
      {
        title: 'Analyzing circular dependencies...',
        task: async (_, task) =>
          task.newListr([
            {
              title: 'Wait a moment...',
              task: async (ctx, task) => {
                let result = await callWorker({
                  exec: 'analyze',
                  entries: ctx.entries,
                });

                if (filter) {
                  const matcher = minimatch.filter(filter);
                  result = result.filter((v) => v.some(matcher));
                }

                task.title = `${chalk.cyan(result.length)} circles were found${
                  filter ? `, filtered with ${chalk.yellow(filter)}` : ''
                }.`;

                ctx.result = result;
              },
            },
          ]),
      },
    ],
    {
      rendererOptions: {
        collapseSubtasks: false,
        timer: PRESET_TIMER,
      },
    },
  );

  await runner.run(ctx);

  return ctx.result;
}
