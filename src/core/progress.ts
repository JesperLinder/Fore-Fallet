/**
 * Spelarens framsteg (bästa antal stjärnor per nivå, tagna guldstjärnor) och inställningar (ljud av/på).
 * Det här är den ENDA modulen som rör lagringen:
 * - i iOS-appen: Capacitor Preferences (iOS kan rensa localStorage i en webbvy)
 * - på webben: localStorage, som tidigare
 * På webben läses och skrivs localStorage direkt, precis som förut. I appen läses Preferences in en gång när
 * modulen laddas (top-level await) och hålls sedan i minnet; varje ändring skrivs direkt till Preferences.
 * Resten av spelet ser bara de synkrona funktionerna i `framsteg`.
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { skarmdumpslage } from '../debug/flaggor';
import { skarmdumpFramsteg } from '../debug/Skarmdump';

const NYCKEL = 'forefallet.framsteg.v1';
const APP = Capacitor.isNativePlatform();

interface Framsteg {
  stjarnor: Record<string, number>;
  /** Nivåer där guldstjärnan tagits. Räknas inte i totalen. */
  guld?: Record<string, true>;
  /** Saknas = ljudet på. */
  ljud?: boolean;
  /** Grattisskärmen har visats (efter första gången hela spelet klarats). */
  grattisSett?: boolean;
  /** Formatversion. 2: halvvägsvinster sparas som hela stjärnor (tidigare halverade). */
  version?: number;
}

function tolka(radata: string | null | undefined): Framsteg | null {
  try {
    const data = radata ? (JSON.parse(radata) as Framsteg) : null;
    return data && typeof data.stjarnor === 'object' && data.stjarnor ? data : null;
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

async function laddaFranPreferences(): Promise<Framsteg> {
  try {
    const { value } = await Preferences.get({ key: NYCKEL });
    const sparat = tolka(value);
    if (sparat) return sparat;
    // Första starten med Preferences: flytta över det som eventuellt finns i webbvyns localStorage.
    const gammalt = tolka(lasLokalt());
    if (gammalt) void Preferences.set({ key: NYCKEL, value: JSON.stringify(gammalt) });
    return gammalt ?? { stjarnor: {} };
  } catch {
    return { stjarnor: {} };
  }
}

/** Appens data i minnet (används inte på webben). */
const cache: Framsteg = APP ? await laddaFranPreferences() : { stjarnor: {} };
/** Skrivningar till Preferences i tur och ordning, så att den senaste alltid vinner. */
let koa: Promise<unknown> = Promise.resolve();

/** Skärmdumpsläget: påhittade framsteg som bara finns i minnet (de riktiga sparade framstegen rörs inte). */
const minne: Framsteg | null = skarmdumpslage ? skarmdumpFramsteg() : null;

function lasData(): Framsteg {
  if (minne) return minne;
  return APP ? cache : (tolka(lasLokalt()) ?? { stjarnor: {} });
}

function skrivData(data: Framsteg): void {
  if (minne) {
    if (data !== minne) Object.assign(minne, data);
    return;
  }
  const json = JSON.stringify(data);
  if (APP) {
    if (data !== cache) {
      for (const k of Object.keys(cache) as (keyof Framsteg)[]) delete cache[k];
      Object.assign(cache, data);
    }
    koa = koa.then(() => Preferences.set({ key: NYCKEL, value: json })).catch(() => {});
    return;
  }
  try {
    window.localStorage.setItem(NYCKEL, json);
  } catch {
    // Privat läge eller full lagring – spelet fungerar ändå, framstegen sparas bara inte.
  }
}

export const framsteg = {
  /** Bästa resultat för en nivå, eller undefined om den aldrig spelats klart. */
  stjarnor(nivaId: string): number | undefined {
    return lasData().stjarnor[nivaId];
  },

  arKlar(nivaId: string): boolean {
    return this.stjarnor(nivaId) !== undefined;
  },

  /** Sparar ett resultat. Behåller det bästa om nivån redan spelats. */
  sparaResultat(nivaId: string, stjarnor: number): void {
    const data = lasData();
    const tidigare = data.stjarnor[nivaId];
    data.stjarnor[nivaId] = tidigare === undefined ? stjarnor : Math.max(tidigare, stjarnor);
    skrivData(data);
  },

  harGuld(nivaId: string): boolean {
    return lasData().guld?.[nivaId] === true;
  },

  sparaGuld(nivaId: string): void {
    const data = lasData();
    data.guld = { ...data.guld, [nivaId]: true };
    skrivData(data);
  },

  /** Engångsflytt: halvvägsnivåer sparades förr med halverade stjärnor (max 1,5). Dubblas till 0–3. */
  uppgraderaHalvvags(nivaIds: string[]): void {
    const data = lasData();
    if ((data.version ?? 1) >= 2) return;
    for (const id of nivaIds) if (data.stjarnor[id] !== undefined) data.stjarnor[id] = Math.min(3, data.stjarnor[id] * 2);
    data.version = 2;
    skrivData(data);
  },

  totalaStjarnor(): number {
    return Object.values(lasData().stjarnor).reduce((summa, s) => summa + s, 0);
  },

  nollstall(): void {
    const { ljud } = lasData();
    skrivData({ stjarnor: {}, ljud, version: 2 });
  },

  harSettGrattis(): boolean {
    return lasData().grattisSett === true;
  },

  sattGrattisSett(): void {
    const data = lasData();
    data.grattisSett = true;
    skrivData(data);
  },

  ljudPa(): boolean {
    return lasData().ljud !== false;
  },

  sattLjud(pa: boolean): void {
    const data = lasData();
    data.ljud = pa;
    skrivData(data);
  },
};
