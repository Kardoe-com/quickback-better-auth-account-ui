import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Library mode: produces ES modules for npm consumption
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        worker: path.resolve(__dirname, 'src/worker.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@tanstack/react-query-devtools',
      ],
    },
  },
});
