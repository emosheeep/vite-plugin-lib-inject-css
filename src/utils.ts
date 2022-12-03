import { chalk, fs } from 'zx';

export const extensions = ['js', 'ts', 'jsx', 'tsx', 'vue', 'mjs', 'cjs'] as const;
export type Ext = (typeof extensions)[number];

/**
 * Replace consecutive '/'s with one '/' in a common path.
 */
export const normalizePath = (path: string) => path.replaceAll(/\/+/g, '/');

/**
 * Replace alias with real path.
 * @param source - source path
 * @param alias - alias configurations
 */
export function replaceAlias(source, alias) {
  for (const [from, to] of Object.entries(alias)) {
    if (source.startsWith('.')) return source;
    if (source === from) return to;
    if (source.startsWith(`${from}/`)) {
      return normalizePath(`${to}/${source.slice(from.length)}`);
    }
  }
  return source;
}

/**
 * Autocompletion for path suffixes.
 */
export function pathRevert(origin: string) {
  if (fs.existsSync(origin) && !fs.statSync(origin).isDirectory()) return origin;
  for (const ext of extensions) {
    for (const result of [`${origin}.${ext}`, `${origin}/index.${ext}`]) {
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
    console.log([
      chalk.underline(`Circle.${i + 1} - ${items.length} files`),
      ...items.map(v => `→ ${colorize(v)}`),
    ].join('\n'));
  }
  console.log('\n');
}
