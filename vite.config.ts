import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'dist/client/static',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, 'client/dashboard.ts'),
        jobs: resolve(__dirname, 'client/jobs.ts'),
        'job-detail': resolve(__dirname, 'client/job-detail.ts'),
        analytics: resolve(__dirname, 'client/analytics.ts'),
        profile: resolve(__dirname, 'client/profile.ts'),
        styles: resolve(__dirname, 'public/styles.css'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
