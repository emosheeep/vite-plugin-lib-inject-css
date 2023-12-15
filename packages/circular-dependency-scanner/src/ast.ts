import { fs } from 'zx';
import ts from 'typescript';
import sfc from '@vue/compiler-sfc';

interface Visitor {
  onImportFrom?(value: string): void;
  onExportFrom?(value: string): void;
}

function getScriptContentFromVue(filename: string) {
  const { descriptor: result } = sfc.parse(fs.readFileSync(filename, 'utf-8'));
  const { script, scriptSetup } = result;
  const scriptNode = script || scriptSetup;
  return scriptNode?.content;
}

/**
 * Get import/require source from ts ast
 * @example
 * ```
 * import test from './test'; // got './test'
 * import './test'; // got './test'
 * import('./test'); // got './test'
 * require('./test'); // got './test'
 * ```
 */
function handleImportFrom(node: ts.Node, callback) {
  if (!node || !callback) return;
  if (ts.isCallExpression(node)) {
    const { expression } = node;
    if (
      /* require call */ ts.isIdentifier(expression) &&
      expression.escapedText === 'require'
    ) {
      const arg0 = node.arguments[0];
      if (arg0 && ts.isStringLiteral(arg0)) {
        callback(arg0.text);
      }
    } else if (
      /* import expression */ node.expression.kind ===
      ts.SyntaxKind.ImportKeyword
    ) {
      const arg0 = node.arguments[0];
      if (arg0 && ts.isStringLiteral(arg0)) {
        callback(arg0.text);
      }
    }
  } else if (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    callback(node.moduleSpecifier.text);
  }
}

/**
 * Get export source from ts ast
 * @example
 * ```
 * export * from './test'; // then got './test'
 * export { a }; // no export source
 * ```
 */
function handleExportFrom(node: ts.Node, callback) {
  if (!node || !callback) return;
  if (
    ts.isExportDeclaration(node) &&
    node.moduleSpecifier &&
    ts.isStringLiteral(node.moduleSpecifier)
  ) {
    callback(node.moduleSpecifier.text);
  }
}

export function walkTsNode(node: ts.Node, cb: (node: ts.Node) => void) {
  cb(node);
  node.forEachChild((child) => walkTsNode(child, cb));
}

/**
 * @param file - absolute file path
 * @param visitor - ast visitor
 */
export function walkFile(filename: string, visitor: Visitor = {}) {
  filename.endsWith('.vue')
    ? walkScript(getScriptContentFromVue(filename) || '', visitor)
    : walkScript(fs.readFileSync(filename, 'utf-8'), visitor);
}

/**
 * Script AST traverse
 * @param source - script file content
 * @param visitor
 */
export function walkScript(source: string, visitor: Visitor) {
  walkTsNode(
    ts.createSourceFile(
      '__virtual-filename.tsx',
      source,
      ts.ScriptTarget.ESNext,
    ),
    (node) => {
      visitor.onImportFrom && handleImportFrom(node, visitor.onImportFrom);
      visitor.onExportFrom && handleExportFrom(node, visitor.onExportFrom);
    },
  );
}
