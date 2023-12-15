import { createRequire } from 'module';
import { scanComponents } from '../dist/index.js';

const vueFile = createRequire(import.meta.url).resolve('./test.vue');

console.log(
  await scanComponents({
    namingStyle: 'kebab-case',
    ignore: ['**/dist/**'],
    libraryNames: ['ant-design-vue', 'my-component-lib'],
    files: [vueFile],
  }),
);
