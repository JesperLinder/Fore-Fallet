/**
 * Spelarens framsteg (bästa antal stjärnor per nivå) och inställningar (ljud av/på).
 * Det här är den ENDA modulen som rör lagringen. Vill vi byta localStorage mot t.ex.
 * Capacitor Preferences eller en server räcker det att ändra lasData/skrivData här.
 */
const NYCKEL = 'forefallet.framsteg.v1';

interface Framsteg {
  stjarnor: Record<string, number>;
  /** Saknas = ljudet på. */
  ljud?: boolean;
}

function lasData(): Framsteg {
  try {
    const radata = window.localStorage.getItem(NYCKEL);
    const data = radata ? (JSON.parse(radata) as Framsteg) : null;
    return data && typeof data.stjarnor === 'object' ? data : { stjarnor: {} };
  } catch {
    return { stjarnor: {} };
  }
}

function skrivData(data: Framsteg): void {
  try {
    window.localStorage.setItem(NYCKEL, JSON.stringify(data));
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

  totalaStjarnor(): number {
    return Object.values(lasData().stjarnor).reduce((summa, s) => summa + s, 0);
  },

  nollstall(): void {
    const { ljud } = lasData();
    skrivData({ stjarnor: {}, ljud });
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
