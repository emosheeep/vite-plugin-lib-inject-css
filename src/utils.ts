import { chalk, fs, path } from 'zx';

export const extensions = ['js', 'ts', 'jsx', 'tsx', 'vue', 'mjs', 'cjs'] as const;
export type Ext = (typeof extensions)[number];

/**
 * Remove trailing  '/' '\'
 * @param {string} str
 * @returns {string}
 */
export const removeTrailingSlash = str =>
  /[/\\]/.test(str)
    ? removeTrailingSlash(str.slice(0, -1))
    : str;

/**
 * Replace alias with real path.
 * @param source - source path
 * @param alias - alias configurations
 */
export function replaceAlias(source: string, alias: Record<string, string>) {
  for (const [from, to] of Object.entries(alias)) {
    if (source.startsWith('.')) return source;
    if (source === from) return to;
    if (source.startsWith(path.join(from, '/'))) {
      return path.join(to, source.slice(from.length));
    }
  }
  return source;
}

/**
 * Autocompletion for path suffixes.
 */
export function revertExtension(origin) {
  if (fs.existsSync(origin) && !fs.statSync(origin).isDirectory()) return origin;
  for (const ext of extensions) {
    for (const result of [
      `${removeTrailingSlash(origin)}.${ext}`,
      path.join(origin, `index.${ext}`),
    ]) {
      if (fs.existsSync(result)) return result;
    }
  }
}

/**
 * Get import specifiers's real path from file.
 */
export function getRealPathOfSpecifier(
  filename: string,
  specifier: string,
  alias: Record<string, string>,
) {
  return revertExtension(
    specifier.startsWith('.')
      ? path.resolve(path.dirname(filename), specifier)
      : replaceAlias(specifier, alias),
  );
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
