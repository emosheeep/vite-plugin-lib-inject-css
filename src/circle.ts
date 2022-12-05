import fg from 'fast-glob';
import { path } from 'zx';
import { analyzeGraph, type Edge } from 'graph-cycles';
import { walkFile } from './ast';
import { replaceAlias, pathRevert, extensions } from './utils';

export interface DetectOptions {
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
}

/**
 * Detect circles among dependencies.
 */
export function circularDepsDetect(options: DetectOptions) {
  let { cwd = process.cwd(), ignore = [], absolute = false, alias } = options;

  /* ----------- Parameters pre-handle start ----------- */

  ignore = [...new Set([...ignore, '**/node_modules/**'])];

  // convert alias to absolute path
  alias = Object.fromEntries(
    Object.entries(Object.assign({ '@': 'src' }, alias))
      .map(([from, to]) => [from, path.resolve(cwd, to)]),
  );

  /* ------------ Parameters pre-handle end ------------ */

  function getDeps(filename, source) {
    const abPath = source.startsWith('.')
      ? path.resolve(path.dirname(filename), source)
      : replaceAlias(source, alias);

    return pathRevert(abPath);
  }

  // files matching with exts
  const files = fg.sync(
    `**/*.{${extensions.join(',')}}`,
    { cwd, absolute: true, ignore },
  );

  // pull out import specifiers of files
  const entries: Edge[] = [];
  for (const filename of files) {
    const deps: string[] = [];
    const visitor = value => (value = getDeps(filename, value)) && deps.push(value);
    walkFile(filename, { onExportFrom: visitor, onImportFrom: visitor });
    entries.push(
      absolute
        ? [filename, deps]
        : [path.relative(cwd, filename), deps.map(v => path.relative(cwd, v))],
    );
  }

  return analyzeGraph(entries);
}
