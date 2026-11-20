/**
 * Läser in alla nivåfiler i src/levels/ och svarar på frågor om dem:
 * vilken ordning, vilka som är spelbara och vilka som är upplåsta.
 */
import type { Niva, NivaPlatshallare } from './levelTypes';
import { framsteg } from './progress';
import { hittaPlatshallare } from './placeholders';
import { harMekanik } from '../mechanics/registry';
import { testlage } from '../debug/flaggor';

// Filer som börjar med _ (t.ex. _mall-invaders.json) är mallar och läses inte in.
const moduler = import.meta.glob<NivaPlatshallare | Niva>(['../levels/*.json', '!../levels/_*.json'], {
  eager: true,
  import: 'default',
});

// Varna i konsolen för platshållartext inom hakparenteser, så att ingen följer med till App Store.
for (const niva of Object.values(moduler)) {
  for (const f of hittaPlatshallare(niva)) console.warn(`Platshållartext i nivån "${niva.id}": ${f.sokvag}: "${f.text}"`);
}

/** Alla nivåer, sorterade efter nummer. */
export const allaNivaer: (NivaPlatshallare | Niva)[] = Object.values(moduler).sort(
  (a, b) => a.nummer - b.nummer,
);

framsteg.uppgraderaHalvvags(allaNivaer.filter((n) => 'resultat' in n && n.resultat === 'halvvagsvinst').map((n) => n.id));

/** Sant om filen är en fullständig nivå (inte bara en platshållare) och mekaniken finns byggd. */
export function arSpelbar(niva: NivaPlatshallare | Niva): niva is Niva {
  return 'domslut' in niva && 'objekt' in niva && harMekanik(niva.mekanik);
}

/** Antal stjärnor som krävs på en nivå för att nästa ska låsas upp. */
export const STJARNOR_FOR_NASTA = 1;

/** Sant om spelaren klarat nivån tillräckligt bra för att gå vidare (minst en stjärna). */
export function arGodkand(niva: NivaPlatshallare | Niva): boolean {
  return (framsteg.stjarnor(niva.id) ?? 0) >= STJARNOR_FOR_NASTA;
}

/** En nivå är upplåst om den är spelbar och föregående nivå är godkänd (i testläget: alla spelbara). */
export function arUpplast(niva: NivaPlatshallare | Niva): niva is Niva {
  const index = allaNivaer.indexOf(niva);
  const foregaende = allaNivaer[index - 1];
  return arSpelbar(niva) && (testlage || !foregaende || arGodkand(foregaende));
}

export function hamtaNiva(id: string): NivaPlatshallare | Niva | undefined {
  return allaNivaer.find((n) => n.id === id);
}

export function nastaNiva(id: string): NivaPlatshallare | Niva | undefined {
  const index = allaNivaer.findIndex((n) => n.id === id);
  return allaNivaer[index + 1];
}

/** Hur många stjärnor som finns att ta i hela säsongen. */
export function maxTotalaStjarnor(): number {
  return allaNivaer.length * 3;
}

/** Hela spelet är klarat: alla nivåer har minst en stjärna (en halvvägsvinst räknas som klarad). */
export function spelKlarat(): boolean {
  return allaNivaer.every((n) => arGodkand(n));
}

