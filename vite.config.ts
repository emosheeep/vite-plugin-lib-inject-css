import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    minify: false,
    lib: {
      fileName: 'index',
      formats: ['es', 'cjs'],
      entry: 'src/index.ts',
    },
    rollupOptions: {
      external: [
        '@vue/compiler-sfc',
        'commander',
        'fast-glob',
        'graph-cycles',
        'minimatch',
        'typescript',
        'zx',
      ],
    },
  },
});
