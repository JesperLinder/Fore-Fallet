/**
 * Öppnar en extern länk (t.ex. "Läs hela fallet").
 * I iOS-appen visas sidan i en inbyggd webbläsarvy via Capacitors Browser-plugin.
 * På webben öppnas en ny flik DIREKT i tryckhändelsen: Safari (och Firefox) blockerar fönster
 * som öppnas senare, och pluginets webbversion laddas först vid anrop och hinner därför bli för sen.
 */
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export function oppnaLank(url: string): void {
  if (Capacitor.isNativePlatform()) {
    void Browser.open({ url });
    return;
  }
  const flik = window.open(url, '_blank');
  if (flik) {
    flik.opener = null; // den nya fliken ska inte kunna styra spelet
  } else {
    // Blockerad trots allt (strikt popup-spärr): öppna länken i samma flik i stället.
    window.location.href = url;
  }
}
