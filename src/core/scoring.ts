/** Räknar om resultatet till stjärnor: på poäng (stjarngranser) eller på misstag och tid (stjarnkrav). */
import type { Niva, StjarnKrav } from './levelTypes';
import type { MekanikResultat } from '../mechanics/Mechanic';

export function beraknaStjarnor(niva: Niva, r: MekanikResultat): number {
  if (r.nollstallt || r.forlust) return 0;
  const hela = niva.stjarnkrav ? helaKrav(niva.stjarnkrav, r) : helaPoang(niva, r.poang);
  // Halvvägsvinst: man kan som mest få hälften, dvs. 1,5 stjärnor.
  return niva.resultat === 'halvvagsvinst' ? hela / 2 : hela;
}

function helaPoang(niva: Niva, poang: number): number {
  const g = niva.stjarngranser;
  if (!g) return 0;
  return poang >= g.tre ? 3 : poang >= g.tva ? 2 : poang >= g.en ? 1 : 0;
}

function helaKrav(krav: NonNullable<Niva['stjarnkrav']>, r: MekanikResultat): number {
  const uppfyllt = (k: StjarnKrav) =>
    (k.maxMisstag === undefined || (r.misstag ?? 0) <= k.maxMisstag) &&
    (k.tidKvarOver === undefined || (r.tidKvar ?? 0) > k.tidKvarOver);
  return uppfyllt(krav.tre) ? 3 : uppfyllt(krav.tva) ? 2 : uppfyllt(krav.en) ? 1 : 0;
}

/** Högsta möjliga antal stjärnor för nivån. */
export function maxStjarnor(niva: Niva): number {
  return niva.resultat === 'halvvagsvinst' ? 1.5 : 3;
}
