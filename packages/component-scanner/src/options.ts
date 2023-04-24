import { type Visitor } from './ast-helper';
import { type NamingStyle } from './utils';

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
   *     'a-button': 'custom-button', // The custom-button will be treated as a-button
   *     // These two buttons will be treated as a-button
   *     'a-button': [
   *       'custom-button',
   *       'wrapped-button'
   *     ],
   *   }
   * }
   * ```
   * The key and value will be transformed according to the namingStyle.
   */
  alias?: Record<string, string | string[]>;
}
