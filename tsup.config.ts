import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['esm'],
  clean: true,
  dts: true,
  splitting: false,
  entry: [
    'src/index.ts',
    'src/worker.ts',
  ],
});
