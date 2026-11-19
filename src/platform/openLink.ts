/**
 * Externa länkar (t.ex. "Läs hela fallet").
 * På webben används en riktig <a>-länk som webbläsaren själv öppnar: Safari blockerar nya flikar
 * som öppnas från kod (window.open), men aldrig ett tryck på en riktig länk.
 * I iOS-appen fångas trycket och sidan visas i Capacitors Browser-plugin.
 */
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export function kopplaLank(a: HTMLAnchorElement, url: string): void {
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  if (Capacitor.isNativePlatform()) {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      void Browser.open({ url });
    });
  }
}
