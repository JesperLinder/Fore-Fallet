// Capacitor-konfiguration, förberedd för en framtida iOS-app. Kör `npx cap add ios` först när det är dags.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'se.fylgia.forefallet',
  appName: 'Före fallet',
  webDir: 'dist',
  ios: { contentInset: 'never' },
};

export default config;
