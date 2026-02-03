import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const lc = path.resolve('node_modules/layerchart/dist');

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  root: 'client',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '$layerchart': lc,
    },
  },
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
});
