/**
 * Öppnar en extern länk (t.ex. "Läs hela fallet").
 * I iOS-appen visas sidan i en inbyggd webbläsarvy via Capacitors Browser-plugin,
 * i vanlig webbläsare öppnas en ny flik.
 */
import { Browser } from '@capacitor/browser';

export function oppnaLank(url: string): void {
  Browser.open({ url }).catch(() => {
    window.open(url, '_blank', 'noopener');
  });
}
