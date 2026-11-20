/**
 * Spelarens framsteg (bästa antal stjärnor per nivå, tagna guldstjärnor, vilka kapitel-klart-skärmar som visats)
 * och inställningar (ljud av/på). Det här är den ENDA modulen som rör lagringen:
 * - i iOS-appen: Capacitor Preferences (iOS kan rensa localStorage i en webbvy)
 * - på webben: localStorage
 * På webben läses och skrivs localStorage direkt. I appen läses Preferences in en gång när modulen laddas
 * (top-level await) och hålls sedan i minnet; varje ändring skrivs direkt till Preferences.
 * Resten av spelet ser bara de synkrona funktionerna i `framsteg`, som tar emot nivå-id:n.
 *
 * Sparformat (version 3): framstegen ligger per kapitel-id.
 *   { version: 3, ljud?: false, kapitel: { "kapitel-1": { stjarnor: { golfbollen: 3 }, guld?: {…}, klartSett?: true } } }
 * Äldre format migreras automatiskt första gången de läses (se migrera() nedan):
 *   version 1: { stjarnor, guld?, ljud? } där halvvägsvinster sparades halverade (max 1,5)
 *   version 2: { stjarnor, guld?, ljud?, grattisSett?, version: 2 }
 * Vilket kapitel en nivå hör till får modulen av core/levels.ts via kopplaKapitel().
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { skarmdumpslage } from '../debug/flaggor';
import { skarmdumpFramsteg } from '../debug/Skarmdump';

const NYCKEL = 'forefallet.framsteg.v1';
const APP = Capacitor.isNativePlatform();
export const SPARFORMAT = 3;
/** Kapitlet som nivåer utan känt kapitel hamnar i vid migreringen (alla nivåer före version 3). */
export const FORSTA_KAPITLET = 'kapitel-1';

export interface KapitelFramsteg {
  stjarnor: Record<string, number>;
  /** Nivåer där guldstjärnan tagits. Räknas inte i totalen. */
  guld?: Record<string, true>;
  /** Skärmen efter kapitlet (grattis eller "Kapitel klart") har visats. */
  klartSett?: boolean;
}

export interface Framsteg {
  version: number;
  /** Saknas = ljudet på. */
  ljud?: boolean;
  kapitel: Record<string, KapitelFramsteg>;
}

/** Äldre sparformat (version 1 och 2), innan kapitlen. */
interface GammaltFramsteg {
  stjarnor: Record<string, number>;
  guld?: Record<string, true>;
  ljud?: boolean;
  grattisSett?: boolean;
  version?: number;
}

/** Tar emot sparad data i vilket format som helst och returnerar version 3. Ändrar inte indata. */
export function migrera(
  radata: unknown,
  kapitelFor: (nivaId: string) => string | undefined,
  halvvagsNivaer: string[],
): Framsteg {
  const d = radata as Partial<Framsteg & GammaltFramsteg> | null;
  if (!d || typeof d !== 'object') return { version: SPARFORMAT, kapitel: {} };
  if ((d.version ?? 1) >= 3 && d.kapitel && typeof d.kapitel === 'object') return d as Framsteg;
  if (!d.stjarnor || typeof d.stjarnor !== 'object') return { version: SPARFORMAT, ljud: d.ljud, kapitel: {} };

  // Version 1 -> 2: halvvägsnivåer sparades med halverade stjärnor (max 1,5). Dubblas till 0–3.
  const stjarnor: Record<string, number> = { ...d.stjarnor };
  if ((d.version ?? 1) < 2) {
    for (const id of halvvagsNivaer) if (stjarnor[id] !== undefined) stjarnor[id] = Math.min(3, stjarnor[id] * 2);
  }

  // Version 2 -> 3: dela upp per kapitel.
  const ut: Framsteg = { version: SPARFORMAT, kapitel: {} };
  if (d.ljud !== undefined) ut.ljud = d.ljud;
  const kapitel = (id: string): KapitelFramsteg => {
    const k = kapitelFor(id) ?? FORSTA_KAPITLET;
    return (ut.kapitel[k] ??= { stjarnor: {} });
  };
  for (const [id, s] of Object.entries(stjarnor)) kapitel(id).stjarnor[id] = s;
  for (const id of Object.keys(d.guld ?? {})) {
    const k = kapitel(id);
    k.guld = { ...k.guld, [id]: true };
  }
  // Grattisskärmen visades efter det enda kapitel som fanns.
  if (d.grattisSett) (ut.kapitel[FORSTA_KAPITLET] ??= { stjarnor: {} }).klartSett = true;
  return ut;
}

function tolka(radata: string | null | undefined): unknown {
  try {
    return radata ? JSON.parse(radata) : null;
  } catch {
    return null;
  }
}

function lasLokalt(): string | null {
  try {
    return window.localStorage.getItem(NYCKEL);
  } catch {
    return null;
  }
}

async function laddaFranPreferences(): Promise<unknown> {
  try {
    const { value } = await Preferences.get({ key: NYCKEL });
    const sparat = tolka(value);
    if (sparat) return sparat;
    // Första starten med Preferences: flytta över det som eventuellt finns i webbvyns localStorage.
    const gammalt = tolka(lasLokalt());
    if (gammalt) void Preferences.set({ key: NYCKEL, value: JSON.stringify(gammalt) });
    return gammalt;
  } catch {
    return null;
  }
}

/** Appens data i minnet (används inte på webben). */
let cache: unknown = APP ? await laddaFranPreferences() : null;
/** Skrivningar till Preferences i tur och ordning, så att den senaste alltid vinner. */
let koa: Promise<unknown> = Promise.resolve();
/** Skärmdumpsläget: påhittade framsteg som bara finns i minnet (de riktiga sparade framstegen rörs inte). */
let minne: Framsteg | null = skarmdumpslage ? skarmdumpFramsteg() : null;

/** Vilket kapitel en nivå hör till, och vilka nivåer som är halvvägsvinster (för migreringen). */
let kapitelFor: (nivaId: string) => string | undefined = () => undefined;
let halvvagsNivaer: string[] = [];
let kopplad = false;

function lasData(): Framsteg {
  if (minne) return minne;
  const radata = APP ? cache : tolka(lasLokalt());
  const data = migrera(radata, kapitelFor, halvvagsNivaer);
  // Gammalt format: spara det nya direkt (men först när kapitlen är kända).
  if (data !== radata && radata && kopplad) skrivData(data);
  return data;
}

function skrivData(data: Framsteg): void {
  if (minne) {
    minne = data;
    return;
  }
  const json = JSON.stringify(data);
  if (APP) {
    cache = data;
    koa = koa.then(() => Preferences.set({ key: NYCKEL, value: json })).catch(() => {});
    return;
  }
  try {
    window.localStorage.setItem(NYCKEL, json);
  } catch {
    // Privat läge eller full lagring – spelet fungerar ändå, framstegen sparas bara inte.
  }
}

/** Kapitlets framsteg för en nivå (skapas vid behov). */
function forNiva(data: Framsteg, nivaId: string): KapitelFramsteg {
  const k = kapitelFor(nivaId) ?? FORSTA_KAPITLET;
  return (data.kapitel[k] ??= { stjarnor: {} });
}

export const framsteg = {
  /**
   * Anropas en gång av core/levels.ts när nivåerna och kapitlen är inlästa: vilket kapitel varje nivå hör till
   * och vilka nivåer som är halvvägsvinster. Gamla sparningar migreras och sparas om i det nya formatet.
   */
  kopplaKapitel(nivaTillKapitel: (nivaId: string) => string | undefined, halvvags: string[]): void {
    kapitelFor = nivaTillKapitel;
    halvvagsNivaer = halvvags;
    kopplad = true;
    lasData();
  },

  /** Bästa resultat för en nivå, eller undefined om den aldrig spelats klart. */
  stjarnor(nivaId: string): number | undefined {
    return forNiva(lasData(), nivaId).stjarnor[nivaId];
  },

  arKlar(nivaId: string): boolean {
    return this.stjarnor(nivaId) !== undefined;
  },

  /** Sparar ett resultat. Behåller det bästa om nivån redan spelats. */
  sparaResultat(nivaId: string, stjarnor: number): void {
    const data = lasData();
    const k = forNiva(data, nivaId);
    const tidigare = k.stjarnor[nivaId];
    k.stjarnor[nivaId] = tidigare === undefined ? stjarnor : Math.max(tidigare, stjarnor);
    skrivData(data);
  },

  harGuld(nivaId: string): boolean {
    return forNiva(lasData(), nivaId).guld?.[nivaId] === true;
  },

  sparaGuld(nivaId: string): void {
    const data = lasData();
    const k = forNiva(data, nivaId);
    k.guld = { ...k.guld, [nivaId]: true };
    skrivData(data);
  },

  /** Summan av stjärnorna, i ett kapitel eller (utan kapitel-id) i hela spelet. */
  totalaStjarnor(kapitelId?: string): number {
    const kapitel = Object.entries(lasData().kapitel).filter(([id]) => !kapitelId || id === kapitelId);
    return kapitel.reduce((summa, [, k]) => summa + Object.values(k.stjarnor).reduce((s, n) => s + n, 0), 0);
  },

  nollstall(): void {
    const { ljud } = lasData();
    skrivData(ljud === undefined ? { version: SPARFORMAT, kapitel: {} } : { version: SPARFORMAT, ljud, kapitel: {} });
  },

  /** Skärmen efter kapitlet (grattis eller "Kapitel klart") har visats. */
  harSettKapitelKlart(kapitelId: string): boolean {
    return lasData().kapitel[kapitelId]?.klartSett === true;
  },

  sattKapitelKlartSett(kapitelId: string): void {
    const data = lasData();
    (data.kapitel[kapitelId] ??= { stjarnor: {} }).klartSett = true;
    skrivData(data);
  },

  ljudPa(): boolean {
    return (lasData() as { ljud?: boolean }).ljud !== false;
  },

  sattLjud(pa: boolean): void {
    const data = lasData();
    data.ljud = pa;
    skrivData(data);
  },
};
