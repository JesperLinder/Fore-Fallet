/**
 * Regelmotorn för märkta projektiler (invaders, sköldläge). Håller reda på vilka märkningar som redan träffats
 * per kategori och bedömer varje träff och varje blockering mot kategorins regel i nivåfilen.
 */
import type { SkyttarInstallningar, Utfall } from '../../core/levelTypes';

export interface Bedomning {
  /** Sant om spelaren gjorde fel. utfall = nivåfilens konsekvens (kan saknas). */
  fel: boolean;
  utfall?: Utfall;
  /** Sant om det här var den första träffen för märkningen i en "en-per-markning"-kategori. */
  forstaTraff: boolean;
}

export class Projektilregler {
  /** kategori -> märkningar som redan träffats. */
  private traffade = new Map<string, Set<string>>();

  constructor(private inst: SkyttarInstallningar) {}

  /** Bedömer en projektil som blockerats (blockerad = true) eller träffat (false), och uppdaterar läget. */
  bedom(typ: string, markning: string, blockerad: boolean): Bedomning {
    const t = this.inst.typer[typ];
    const kat = t ? this.inst.kategorier[t.kategori] : undefined;
    if (!t || !kat) return { fel: false, forstaTraff: false };
    const set = this.traffade.get(t.kategori) ?? new Set<string>();
    this.traffade.set(t.kategori, set);

    switch (kat.regel) {
      case 'en-per-markning': {
        const forsta = !set.has(markning);
        if (blockerad) return { fel: forsta, utfall: forsta ? kat.vidFelBlock : undefined, forstaTraff: false };
        set.add(markning);
        return { fel: !forsta, utfall: forsta ? undefined : kat.vidFelSlapp, forstaTraff: forsta };
      }
      case 'slapp-alltid':
        return { fel: blockerad, utfall: blockerad ? kat.vidFelBlock : undefined, forstaTraff: false };
      case 'blockera-alltid':
        return { fel: !blockerad, utfall: blockerad ? undefined : kat.vidFelSlapp, forstaTraff: false };
    }
  }
}
