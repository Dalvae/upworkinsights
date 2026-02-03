import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  root: 'client',
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'chart': ['chart.js'],
          'ui': ['bits-ui'],
        },
      },
    },
  },
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
});
