// Capacitor-konfiguration för iOS-appen. Bygg: npm run build && npx cap sync ios (se README, "Bygga för iOS").
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'se.fylgia.forefallet',
  appName: 'Före fallet',
  webDir: 'dist',
  // Mörkgrön bakom webbvyn, så att det inte blinkar vitt mellan startbilden och spelet.
  backgroundColor: '#0F2827',
  ios: { contentInset: 'never' },
};

export default config;
