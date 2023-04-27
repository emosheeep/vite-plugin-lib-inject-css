import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { libInjectCss, scanEntries } from 'vite-plugin-lib-inject-css';

export default defineConfig({
  plugins: [
    vue(),
    libInjectCss({
      formats: ['es'],
      entry: scanEntries('src'),
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
    }),
  ],
});
