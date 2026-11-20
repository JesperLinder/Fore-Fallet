/**
 * Platshållartext: text inom hakparenteser, t.ex. "[FYLLS I AV MÅLANSVARIG]".
 * Sådan text visas i vinrött i spelet och ger en varning i konsolen när nivåerna läses in,
 * så att ingen platshållare följer med till App Store av misstag. Se också scripts/kolla-platshallare.mjs.
 */
const PLATSHALLARE = /\[[^\]\n]+\]/;

export function arPlatshallare(text: string | undefined): boolean {
  return !!text && PLATSHALLARE.test(text);
}

/** Alla textvärden i ett objekt som innehåller platshållare, med sökväg, t.ex. "domslut.inteVunnet". */
export function hittaPlatshallare(varde: unknown, sokvag = ''): { sokvag: string; text: string }[] {
  if (typeof varde === 'string') return arPlatshallare(varde) ? [{ sokvag, text: varde }] : [];
  if (Array.isArray(varde)) return varde.flatMap((v, i) => hittaPlatshallare(v, `${sokvag}[${i}]`));
  if (varde && typeof varde === 'object') {
    return Object.entries(varde).flatMap(([k, v]) => hittaPlatshallare(v, sokvag ? `${sokvag}.${k}` : k));
  }
  return [];
}
