import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  root: 'client',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
  },
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
});
