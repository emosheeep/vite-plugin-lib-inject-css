import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  format: 'esm',
  outDir: 'dist',
  entry: ['src/index.ts', 'src/worker.ts'],
});
