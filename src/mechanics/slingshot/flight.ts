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

/** Vinden inför nästa kast: fast, eller slumpad inom vind.variation (samma regel för slangbella och hybrid). */
export function slumpaVind(v: NonNullable<KastInstallningar['vind']>): { x: number; y: number } {
  if (!v.variation) return { x: v.x, y: v.y };
  const styrka = v.variation.min + Math.random() * (v.variation.max - v.variation.min);
  const motsatt = Math.random() < (v.variation.motsattChans ?? 0);
  return { x: Math.sign(v.x || 1) * styrka * (motsatt ? -1 : 1), y: v.y };
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

/** Matters accelerationsskala: gravitation g ger g * 0.001 * (1000/60)² punkter per steg² vid 60 steg/s. */
const MATTER_G = 0.001 * (1000 / 60) ** 2;

/**
 * Sidovy: punkter längs kastbågen med gravitation och luftmotstånd, samma integration som Matter
 * (hastighet = hastighet · (1 − luft) + g, position += hastighet). Slutar när bågen når marken.
 */
export function forhandsvisningSida(
  startX: number,
  startY: number,
  v0: Hastighet,
  inst: KastInstallningar,
  varN = 3,
): { x: number; y: number }[] {
  const sida = inst.sidvy;
  if (!sida) return [];
  const g = sida.gravitation * MATTER_G;
  const punkter: { x: number; y: number }[] = [];
  let { vx, vy } = v0;
  let x = startX;
  let y = startY;
  for (let i = 1; i <= 240; i++) {
    vx *= 1 - inst.friktion.luft;
    vy = vy * (1 - inst.friktion.luft) + g;
    x += vx;
    y += vy;
    if (y >= sida.mark) {
      punkter.push({ x, y: sida.mark });
      break;
    }
    if (i % varN === 0) punkter.push({ x, y });
  }
  return punkter;
}
