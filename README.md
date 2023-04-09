# FE Tools

This is a monorepo with series helpful tools designed for frond-ends. The source code is located under `packages` folder, prefer to check corresponding directory or click the link for more information.

# Command Line Tools

- [circular-dependency-scanner](https://github.com/emosheeep/fe-tools/tree/HEAD/packages/circular-dependency-scanner) - Out-of-box circular dependencies detector, with both JavaScript API and Command Line Tool built in, support all file types we used in common like `.js,.jsx,.ts,.tsx,.mjs,.cjs,.vue`.
- [component-scanner](https://github.com/emosheeep/fe-tools/tree/HEAD/packages/component-scanner) - Cross-framework and simple web system component scanner, support `vue`(`html`, `pug` template), `react`, `jsx`, `tsx`, help counting component usage.

# Vite Ecosystem

- [vite-plugin-lib-inject-css](https://github.com/emosheeep/fe-tools/tree/HEAD/packages/vite-plugin-lib-inject-css) - Inject css at the top of each chunk file in library mode using `import` statement, support multi-entries build, especially to help building component libraries.