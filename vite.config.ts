// Vite-konfiguration. Relativ base så att bygget fungerar både på webben och inuti Capacitor.
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
});
