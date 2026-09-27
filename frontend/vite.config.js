import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'), // Menggunakan format baru rekomendasi Vite
    },
  },
  css: {
    transformer: 'postcss', // Memaksa menggunakan postcss alih-alih lightningcss internal
  },
  build: {
    cssMinifier: 'esbuild',
  },
});