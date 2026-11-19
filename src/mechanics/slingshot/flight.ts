/**
 * Slangbellans flygmodell. Samma funktioner används både av fysiken (varje Matter-steg)
 * och av den prickade förhandsvisningen, så att banan man ser stämmer med det som händer.
 *
 * Modellen: projektilen är först i luften (påverkas av vind/slice och lite luftmotstånd),
 * landar efter ett antal steg och rullar sedan med markfriktion tills den stannar.
 */
import type { KastInstallningar } from '../../core/levelTypes';

const INGEN_VIND = { x: 0, y: 0 };

export interface Hastighet {
  vx: number;
  vy: number;
}

/** Hur många steg projektilen är i luften, beroende på skottets styrka (0–1). */
export function antalFlygsteg(inst: KastInstallningar, styrka: number): number {
  return Math.round(inst.flygtid.min + (inst.flygtid.max - inst.flygtid.min) * styrka);
}

/** Nästa stegs hastighet. markfriktion används först efter landning. */
export function nastaHastighet(
  v: Hastighet,
  iLuften: boolean,
  inst: KastInstallningar,
  markfriktion: number,
  medVind = true,
  aktuellVind: { x: number; y: number } = inst.vind ?? INGEN_VIND,
): Hastighet {
  const f = iLuften ? inst.friktion.luft : markfriktion;
  const vind = iLuften && medVind ? aktuellVind : { x: 0, y: 0 };
  return { vx: v.vx * (1 - f) + vind.x, vy: v.vy * (1 - f) + vind.y };
}

/** Synlig höjd över marken (bara grafik): en båge under flygningen. */
export function hojd(steg: number, flygsteg: number, styrka: number): number {
  if (steg >= flygsteg) return 0;
  return Math.sin((Math.PI * steg) / flygsteg) * (8 + 30 * styrka);
}

/**
 * Punkter längs flygbanan fram till landning, UTAN vind – spelaren får själv
 * kompensera för slicen. Det är själva utmaningen.
 */
export function forhandsvisning(
  startX: number,
  startY: number,
  v0: Hastighet,
  inst: KastInstallningar,
  styrka: number,
  varN = 3,
): { x: number; y: number }[] {
  const steg = antalFlygsteg(inst, styrka);
  const punkter: { x: number; y: number }[] = [];
  let v = v0;
  let x = startX;
  let y = startY;
  for (let i = 1; i <= steg; i++) {
    v = nastaHastighet(v, true, inst, 0, false);
    x += v.vx;
    y += v.vy;
    if (i % varN === 0 || i === steg) punkter.push({ x, y });
  }
  return punkter;
}
