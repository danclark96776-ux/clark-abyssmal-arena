import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  root: '.',
  appType: 'spa',
  server: {
    host: '0.0.0.0',
    port: 4173
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: ['index.html', 'abysmal-arena.html'],
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/assets.js') || id.includes('/src/data/stages.js')) {
            return 'arena-content';
          }
          if (id.includes('/src/data/')) {
            return 'game-data';
          }
          if (id.includes('/src/game/')) {
            return 'game-core';
          }
          if (id.includes('/node_modules/')) {
            return 'vendor';
          }
          return undefined;
        }
      }
    }
  }
});
