// Vite-konfiguration. Relativ base så att bygget fungerar både på webben och inuti Capacitor.
// GitHub Pages-bygget (.github/workflows/pages.yml) sätter i stället base till /<repo>/ med flaggan --base.
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Versionsnumret från package.json visas på skärmen "Om spelet".
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  define: { __VERSION__: JSON.stringify(version) },
  server: { port: 5173 },
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
});
