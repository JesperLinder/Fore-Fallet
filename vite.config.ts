// Vite-konfiguration. Relativ base så att bygget fungerar både på webben och inuti Capacitor.
// GitHub Pages-bygget (.github/workflows/pages.yml) sätter i stället base till /<repo>/ med flaggan --base.
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173 },
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
});
