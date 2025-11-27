import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/healthcare_democratization': {
        target: 'http://localhost:5008',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/simplify': {
        target: 'http://localhost:5008',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/test': {
        target: 'http://localhost:5008',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}); 