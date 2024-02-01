import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import dtsPlugin from 'vite-plugin-dts';

export default defineConfig({
  plugins: [vue(), libInjectCss(), dtsPlugin()],
  build: {
    lib: {
      formats: ['es'],
      entry: [
        'src/index.ts',
        'src/common.ts',
        'src/demo1/index.ts',
        'src/demo2/index.ts',
      ],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        // Put chunk files at <output>/chunks
        chunkFileNames: 'chunks/[name].[hash].js',
        // Put chunk styles at <output>/assets
        assetFileNames: 'assets/[name][extname]',
        entryFileNames: '[name].js',
      },
    },
  },
});
