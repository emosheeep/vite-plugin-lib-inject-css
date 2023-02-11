import { createRequire } from 'module';
import { scan } from '../dist/index.js';

const vueFile = createRequire(import.meta.url).resolve('./test.vue');

console.log(
  await scan({
    namingStyle: 'kebab-case',
    libraryNames: [
      'ant-design-vue',
      'my-component-lib',
    ],
    files: [
      vueFile,
    ],
  }),
);
