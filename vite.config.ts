import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// App mode: standard SPA build for standalone deployment
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/client',
    sourcemap: true,
  },
});
