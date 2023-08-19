import { defineConfig } from 'vite';
import viteChecker from 'vite-plugin-checker';
import dtsPlugin from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [
    dtsPlugin({
      rollupTypes: true,
    }),
    externalizeDeps({
      nodeBuiltins: true,
      peerDeps: true,
      deps: true,
    }),
    viteChecker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint . --ext .ts,.js',
      },
    }),
  ],
  build: {
    lib: {
      formats: ['cjs', 'es'],
      entry: 'index.ts',
      fileName: 'index',
    },
  },
});
