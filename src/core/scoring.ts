/**
 * Räknar om resultatet till stjärnor: på poäng (stjarngranser) eller på misstag och tid (stjarnkrav).
 * Alla nivåer – även halvvägsvinster – ger 0–3 stjärnor. Guldstjärnan är en valfri bonus utanpå.
 */
import type { Niva, StjarnKrav } from './levelTypes';
import type { MekanikResultat } from '../mechanics/Mechanic';

export function beraknaStjarnor(niva: Niva, r: MekanikResultat): number {
  if (r.nollstallt || r.forlust) return 0;
  return niva.stjarnkrav ? helaKrav(niva.stjarnkrav, r) : helaPoang(niva, r.poang);
}

/** Sant om nivån har en guldstjärna och spelaren uppfyllt dess krav (nivån måste vara vunnen). */
export function beraknaGuld(niva: Niva, r: MekanikResultat): boolean {
  if (!niva.guldstjarna || r.nollstallt || r.forlust) return false;
  return uppfyllt(niva.guldstjarna.krav, r);
}

function helaPoang(niva: Niva, poang: number): number {
  const g = niva.stjarngranser;
  if (!g) return 0;
  return poang >= g.tre ? 3 : poang >= g.tva ? 2 : poang >= g.en ? 1 : 0;
}

function helaKrav(krav: NonNullable<Niva['stjarnkrav']>, r: MekanikResultat): number {
  return uppfyllt(krav.tre, r) ? 3 : uppfyllt(krav.tva, r) ? 2 : uppfyllt(krav.en, r) ? 1 : 0;
}

function uppfyllt(k: StjarnKrav, r: MekanikResultat): boolean {
  return (
    (k.maxMisstag === undefined || (r.misstag ?? 0) <= k.maxMisstag) &&
    (k.tidKvarOver === undefined || (r.tidKvar ?? 0) > k.tidKvarOver) &&
    (k.maxForsok === undefined || (r.forsok ?? 0) <= k.maxForsok) &&
    (k.maxDrag === undefined || (r.drag ?? 0) <= k.maxDrag) &&
    (k.maxFallor === undefined || (r.fallor ?? 0) <= k.maxFallor) &&
    (k.minMatare === undefined || (r.matareKvar ?? 0) >= k.minMatare) &&
    (k.maxDekorForlorade === undefined || (r.dekorForlorade ?? 0) <= k.maxDekorForlorade) &&
    Object.entries(k.maxAntal ?? {}).every(([namn, max]) => (r.antal?.[namn] ?? 0) <= max) &&
    Object.entries(k.minAntal ?? {}).every(([namn, min]) => (r.antal?.[namn] ?? 0) >= min)
  );
}
