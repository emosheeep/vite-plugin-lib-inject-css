import { chalk, fs, path } from 'zx';

export const extensions = [
  'js',
  'ts',
  'jsx',
  'tsx',
  'vue',
  'mjs',
  'cjs',
] as const;

export type Ext = (typeof extensions)[number];

/**
 * Remove trailing  '/' '\'
 * @param {string} str
 * @returns {string}
 */
export const removeTrailingSlash = (str) =>
  /[/\\]$/.test(str) ? removeTrailingSlash(str.slice(0, -1)) : str;

/**
 * Autocompletion for path suffixes.
 */
export function revertExtension(origin: string) {
  if (fs.existsSync(origin) && !fs.statSync(origin).isDirectory())
    return origin;
  for (const ext of extensions) {
    for (const result of [
      `${removeTrailingSlash(origin)}.${ext}`,
      path.posix.join(origin, `index.${ext}`),
    ]) {
      if (fs.existsSync(result)) return result;
    }
  }
}

const colorize = (filename: string) =>
  chalk[
    /\.(jsx?)|([mc]js)$/.test(filename)
      ? 'yellow'
      : /\.tsx?$/.test(filename)
        ? 'blue'
        : /\.vue$/.test(filename)
          ? 'green'
          : 'grey'
  ](filename);

export function printCircles(circles: string[][] = []) {
  console.log('\n');
  for (let i = 0; i < circles.length; i++) {
    const items = circles[i];
    console.log(
      [
        chalk.underline(`Circle.${i + 1} - ${items.length} files`),
        ...items.map((v) => `→ ${colorize(v)}`),
      ].join('\n'),
    );
  }
  console.log('\n');
}
