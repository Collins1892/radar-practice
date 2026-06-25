/// <reference types="vitest/config" />
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/items': {
        target: 'http://localhost:5133',
        bypass(req) {
          if (
            req.method === 'GET' &&
            req.headers.accept?.includes('text/html')
          ) {
            return '/index.html';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    pool: 'threads',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
