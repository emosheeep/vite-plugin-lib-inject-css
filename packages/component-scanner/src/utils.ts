import { camelCase, pascalCase, paramCase as kebabCase } from 'change-case';

export type NamingStyle = 'default' | 'PascalCase' | 'camelCase' | 'kebab-case';

export function transformNamingStyle(name: string, style: NamingStyle = 'default') {
  if (!name) return name; // name is probably undefined
  return style === 'kebab-case'
    ? kebabCase(name)
    : style === 'PascalCase'
      ? pascalCase(name)
      : style === 'camelCase'
        ? camelCase(name)
        : name;
}
