import sfc from '@vue/compiler-sfc';
import { fs } from 'zx';
import { parse as parseHtml } from 'html-parser';
import pugLexer from 'pug-lexer';
import pugParser from 'pug-parser';
import pugWalk from 'pug-walk';
import ts from 'typescript';

export const WrapperContainer = '__wrapper_container__' as const;

export type NamedImports = Array<{ id: string; as?: string }>;

interface ImportParam {
  /** import path id */
  path: string;
  /** default import */
  default?: string;
  /** named import */
  named?: NamedImports;
}

export interface Visitor {
  /** Handle component name from template and jsx */
  onTag(name: string): void;
  /** Handle import specifiers */
  onImport(value: ImportParam): void;
}

export function walkVueFile(filename: string, visitor: Visitor) {
  const { descriptor: result } = sfc.parse(fs.readFileSync(filename, 'utf-8'));
  const { template, script, scriptSetup } = result;

  const scriptNode = script || scriptSetup;

  if (scriptNode) {
    walkScript(scriptNode.content, visitor);
  }

  if (template) {
    if (template.lang === 'pug') {
      pugWalk(
        pugParser(pugLexer(`${WrapperContainer}\n${template.content}`)),
        (node) => {
          if (node.type === 'Tag') {
            visitor.onTag?.(node.name);
          }
        },
      );
    } else {
      parseHtml(template.content, {
        openElement(tagName) {
          visitor.onTag?.(tagName);
        },
      });
    }
  }
}

/**
 * Handle component name from template and jsx
 */
function handleTag(node: ts.Node, callback: Visitor['onTag']) {
  if (!node || !callback) return;
  // handle jsx element
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    ts.isIdentifier(node.tagName) &&
      callback(node.tagName.escapedText as string);
  } else if (ts.isCallExpression(node)) {
    const {
      expression,
      arguments: [arg0],
    } = node;
    if (!arg0) return;

    /**
     * These cases came from {@link https://astexplorer.net/}, parsed by typescript.
     */
    const vueConditions = [
      // 'h' is a name convention that means render function.
      () => ts.isIdentifier(expression) && expression.escapedText === 'h',
      // `this.$createElement` expression
      () =>
        ts.isPropertyAccessExpression(expression) &&
        expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
        ts.isIdentifier(expression.name) &&
        expression.name.escapedText === '$createElement',
    ];

    if (!vueConditions.some((c) => c())) return;

    // whose first argument represent a component name.
    if (ts.isIdentifier(arg0)) {
      callback(arg0.escapedText as string);
    } else if (ts.isStringLiteral(arg0)) {
      callback(arg0.text);
    }
  }
}

/**
 * Handle import declaration.
 */
function handleImportDeclaration(node, callback: Visitor['onImport']) {
  if (ts.isImportDeclaration(node)) {
    const { namedBindings, name } = node.importClause || {};

    let named: NamedImports = [];
    let def =
      name && ts.isIdentifier(name) ? (name.escapedText as string) : undefined;

    if (namedBindings) {
      // import * as xxx from ''
      if (ts.isNamespaceImport(namedBindings)) {
        def = namedBindings.name.escapedText as string;
      } else {
        // import { xx as xx, xxx } from ''
        named = namedBindings.elements
          .filter((v) => ts.isImportSpecifier(v))
          .map((v) =>
            v.propertyName
              ? {
                  id: v.propertyName.escapedText as string,
                  as: v.name.escapedText as string,
                }
              : { id: v.name.escapedText as string },
          );
      }
    }

    if (ts.isStringLiteral(node.moduleSpecifier)) {
      callback({
        named,
        default: def,
        path: node.moduleSpecifier.text,
      });
    }
  }
}

export function walkTsNode(node: ts.Node, cb: (node: ts.Node) => void) {
  cb(node);
  node.forEachChild((child) => walkTsNode(child, cb));
}

/**
 * @param filename - absolute file path
 * @param visitor - ast visitor
 */
export function walkFile(filename: string, visitor: Visitor) {
  filename.endsWith('.vue')
    ? walkVueFile(filename, visitor)
    : walkScript(fs.readFileSync(filename, 'utf-8'), visitor);
}

/**
 * @param source - script file content
 * @param visitor - ast visitor
 */
export function walkScript(source: string, visitor: Visitor) {
  walkTsNode(
    /**
     * Filename is no matter, casually set one.
     * But need to end with .tsx extension, which allows tsx nodes to be parsed.
     */
    ts.createSourceFile(
      '__virtual-filename.tsx',
      source,
      ts.ScriptTarget.ESNext,
    ),
    (node) => {
      visitor.onTag && handleTag(node, visitor.onTag);
      visitor.onImport && handleImportDeclaration(node, visitor.onImport);
    },
  );
}
