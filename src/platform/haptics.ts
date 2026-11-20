/**
 * Lätt vibration vid träff och misstag, via Capacitor Haptics. I appen används telefonens haptik;
 * på webben navigator.vibrate där det finns (t.ex. Android), annars händer inget.
 * Anropas från ljudmodulen, så att ljudknappen styr båda: ljud av betyder också vibration av.
 */
import { Haptics, ImpactStyle } from '@capacitor/haptics';

let senast = 0;

export function vibrera(): void {
  // Högst en vibration per 60 ms, så att flera träffar på en gång inte blir ett surr.
  const nu = performance.now();
  if (nu - senast < 60) return;
  senast = nu;
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
    // Stöds inte (t.ex. Safari på iPhone eller datorns webbläsare) – inget att göra.
  });
}
