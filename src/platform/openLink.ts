/**
 * Externa länkar (t.ex. "Läs hela fallet", lagen.nu, domstol.se, karriärsidan).
 * En riktig <a>-länk med target="_blank" som användaren själv trycker på:
 * - På webben öppnar webbläsaren en ny flik (Safari blockerar nya flikar från window.open, men aldrig ett tryck på en riktig länk).
 * - I iOS-appen fångar Capacitor länken (WKWebView öppnar ett nytt fönster) och lämnar över den till systemet,
 *   så att sidan öppnas i telefonens webbläsare (Safari) och inte inne i appen.
 */
export function kopplaLank(a: HTMLAnchorElement, url: string): void {
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
}
