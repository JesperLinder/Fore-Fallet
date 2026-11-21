/**
 * Läser in kapitlen och nivåerna i src/levels/ och svarar på frågor om dem:
 * vilken ordning, vilka som är spelbara och vilka som är upplåsta.
 *
 * Varje kapitel är en mapp, src/levels/kapitel-N/, med en kapitelfil (kapitel.json: id, nummer, titel,
 * undertitel, färg och nivåernas ordning) och en JSON-fil per nivå. Filer som börjar med _ är mallar.
 */
import type { KapitelFil, Niva, NivaPlatshallare } from './levelTypes';
import { framsteg } from './progress';
import { hittaPlatshallare } from './placeholders';
import { harMekanik } from '../mechanics/registry';
import { testlage } from '../debug/flaggor';
import { text } from '../config/strings';

type NivaFil = Omit<NivaPlatshallare, 'nummer'> & { nummer?: number };

const kapitelFiler = import.meta.glob<KapitelFil>('../levels/*/kapitel.json', { eager: true, import: 'default' });
const nivaFiler = import.meta.glob<NivaFil>(['../levels/*/*.json', '!../levels/*/kapitel.json', '!../levels/**/_*.json'], {
  eager: true,
  import: 'default',
});

export interface Kapitel extends KapitelFil {
  /** Kapitlets nivåer i spelordning. */
  nivaLista: (NivaPlatshallare | Niva)[];
}
export type KapitelStatus = 'klart' | 'pagar' | 'last';

const mapp = (sokvag: string): string => sokvag.split('/').slice(-2, -1)[0];

/** Alla kapitel, sorterade efter nummer. */
export const allaKapitel: Kapitel[] = Object.entries(kapitelFiler)
  .map(([sokvag, fil]) => {
    const iMappen = Object.entries(nivaFiler).filter(([s]) => mapp(s) === mapp(sokvag)).map(([, n]) => n);
    const nivaLista = fil.nivaer.flatMap((id, i) => {
      const n = iMappen.find((x) => x.id === id);
      if (!n) {
        console.warn(`Kapitlet "${fil.id}": nivån "${id}" finns i kapitel.json men ingen nivåfil har det id:t.`);
        return [];
      }
      if (n.nummer !== undefined && n.nummer !== i + 1) {
        console.warn(`Nivån "${id}" har nummer ${n.nummer} men står som nummer ${i + 1} i kapitel.json. Ordningen i kapitel.json gäller.`);
      }
      return [{ ...n, nummer: i + 1 } as NivaPlatshallare | Niva];
    });
    for (const n of iMappen) {
      if (!fil.nivaer.includes(n.id)) console.warn(`Kapitlet "${fil.id}": nivåfilen "${n.id}" saknas i kapitel.json och visas inte.`);
    }
    return { ...fil, nivaLista };
  })
  .sort((a, b) => a.nummer - b.nummer);

/** Alla nivåer i alla kapitel, i spelordning. */
export const allaNivaer: (NivaPlatshallare | Niva)[] = allaKapitel.flatMap((k) => k.nivaLista);

const kapitelForNiva = new Map<string, Kapitel>();
for (const k of allaKapitel) {
  for (const n of k.nivaLista) {
    if (kapitelForNiva.has(n.id)) console.warn(`Nivå-id:t "${n.id}" finns i flera kapitel. Varje nivå måste ha ett eget id.`);
    else kapitelForNiva.set(n.id, k);
  }
}

// Varna i konsolen för platshållartext inom hakparenteser, så att inget följer med till App Store.
for (const k of allaKapitel) {
  const { nivaLista, ...fil } = k;
  for (const f of hittaPlatshallare(fil)) console.warn(`Platshållartext i kapitlet "${k.id}": ${f.sokvag}: "${f.text}"`);
  for (const niva of nivaLista) {
    for (const f of hittaPlatshallare(niva)) console.warn(`Platshållartext i nivån "${niva.id}": ${f.sokvag}: "${f.text}"`);
  }
}

// Framstegen sparas per kapitel: berätta för progress.ts var varje nivå hör hemma (och migrera gamla sparningar).
framsteg.kopplaKapitel(
  (id) => kapitelForNiva.get(id)?.id,
  allaNivaer.filter((n) => 'resultat' in n && n.resultat === 'halvvagsvinst').map((n) => n.id),
);

/** Sant om filen är en fullständig nivå (inte bara en platshållare eller "kommer snart") och mekaniken finns byggd. */
export function arSpelbar(niva: NivaPlatshallare | Niva): niva is Niva {
  return !niva.kommerSnart && 'domslut' in niva && 'objekt' in niva && harMekanik(niva.mekanik);
}

/** Antal stjärnor som krävs på en nivå för att nästa ska låsas upp. */
export const STJARNOR_FOR_NASTA = 1;

/** Sant om spelaren klarat nivån tillräckligt bra för att gå vidare (minst en stjärna). */
export function arGodkand(niva: NivaPlatshallare | Niva): boolean {
  return (framsteg.stjarnor(niva.id) ?? 0) >= STJARNOR_FOR_NASTA;
}

/**
 * En nivå är upplåst om den är spelbar och föregående nivå i kapitlet är godkänd. Kapitlets första nivå
 * är upplåst när kapitlet är det. I testläget är alla spelbara nivåer upplåsta (nivåer som "kommer snart"
 * är inte spelbara och alltså alltid låsta).
 */
export function arUpplast(niva: NivaPlatshallare | Niva): niva is Niva {
  if (!arSpelbar(niva)) return false;
  if (testlage) return true;
  const k = kapitelFor(niva.id);
  if (!k) return false;
  const foregaende = k.nivaLista[k.nivaLista.findIndex((n) => n.id === niva.id) - 1];
  return foregaende ? arGodkand(foregaende) : arKapitelUpplast(k);
}

export function hamtaNiva(id: string): NivaPlatshallare | Niva | undefined {
  return allaNivaer.find((n) => n.id === id);
}

/** Nästa nivå i samma kapitel, eller undefined efter kapitlets sista nivå. */
export function nastaNiva(id: string): NivaPlatshallare | Niva | undefined {
  const k = kapitelFor(id);
  if (!k) return undefined;
  return k.nivaLista[k.nivaLista.findIndex((n) => n.id === id) + 1];
}

// ---------- Kapitel ----------

export function kapitelFor(nivaId: string): Kapitel | undefined {
  return kapitelForNiva.get(nivaId);
}

export function hamtaKapitel(id: string): Kapitel | undefined {
  return allaKapitel.find((k) => k.id === id);
}

export function nastaKapitel(k: Kapitel): Kapitel | undefined {
  return allaKapitel[allaKapitel.indexOf(k) + 1];
}

/** Kapitlet är klarat: det har nivåer och alla har minst en stjärna (en halvvägsvinst räknas). */
export function arKapitelKlarat(k: Kapitel): boolean {
  return k.nivaLista.length > 0 && k.nivaLista.every((n) => arGodkand(n));
}

/** Första kapitlet är alltid upplåst; övriga när föregående kapitel är klarat. I testläget: alla. */
export function arKapitelUpplast(k: Kapitel): boolean {
  const index = allaKapitel.indexOf(k);
  return testlage || index <= 0 || arKapitelKlarat(allaKapitel[index - 1]);
}

export function kapitelStatus(k: Kapitel): KapitelStatus {
  if (arKapitelKlarat(k)) return 'klart';
  return arKapitelUpplast(k) ? 'pagar' : 'last';
}

export function kapitelStjarnor(k: Kapitel): number {
  return framsteg.totalaStjarnor(k.id);
}

export function kapitelMaxStjarnor(k: Kapitel): number {
  return k.nivaLista.length * 3;
}

/** Sant om alla kapitlets nivåer går att spela (inga platshållare eller "kommer snart"). */
export function arKapitelFardigt(k: Kapitel): boolean {
  return k.nivaLista.length > 0 && k.nivaLista.every(arSpelbar);
}

/**
 * Sant om kapitlet är det sista färdiga: inget senare kapitel har alla sina nivåer spelbara.
 * Efter det visas den stora grattisskärmen; efter övriga kapitel "Kapitel klart". Så länge kapitel 2 bara är
 * delvis byggt får kapitel 1 alltså grattisskärmen, precis som innan kapitel 2 fanns.
 */
export function arSistaKapitlet(k: Kapitel): boolean {
  return !allaKapitel.slice(allaKapitel.indexOf(k) + 1).some(arKapitelFardigt);
}

/** "K2 · " före nivåetiketten från kapitel 2; tom för kapitel 1 (som ser ut som förut). */
export function kapitelEtikett(nivaId: string): string {
  const nr = kapitelFor(nivaId)?.nummer ?? 1;
  return nr > 1 ? text.niva.kapitelPrefix(nr) : '';
}

/** Kapitlet som kartan senast visade (eller vars nivå spelades). Kartan öppnar det om inget annat anges. */
let aktivt: Kapitel | undefined;

export function aktivtKapitel(): Kapitel {
  return aktivt ?? allaKapitel[0];
}

export function sattAktivtKapitel(k: Kapitel | undefined): void {
  if (k) aktivt = k;
}

/** Hur många stjärnor som finns att ta i alla spelbara nivåer (visas på grattisskärmen). */
export function maxTotalaStjarnor(): number {
  return allaNivaer.filter(arSpelbar).length * 3;
}
