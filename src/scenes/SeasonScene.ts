/**
 * Avslutningsskärmen för ett kapitel ("Säsongen klar", efter domslutet i kapitlets sista nivå): stor lila stjärna,
 * kapitlets stjärnor, alla dess fall med stjärnor (tryck för att spela om), dela resultatet, "Fortsätt" och,
 * efter det sista spelbara kapitlet, "Säsong N kommer". Vilket kapitel: { kapitel: id } när scenen startas.
 * "Fortsätt" leder första gången kapitlet är klarat till grattisskärmen (efter det sista kapitlet) eller till
 * "Kapitel klart" (efter övriga kapitel), annars till kapitlets karta.
 */
import Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { avstand, farg, radie } from '../config/theme';
import { BREDD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import { lankar } from '../config/links';
import {
  aktivtKapitel,
  arKapitelKlarat,
  arSistaKapitlet,
  arUpplast,
  hamtaKapitel,
  kapitelMaxStjarnor,
  kapitelStjarnor,
  sattAktivtKapitel,
  type Kapitel,
} from '../core/levels';
import { framsteg } from '../core/progress';
import { skapaText } from '../ui/text';
import { fyllStjarna } from '../ui/shapes';
import { ikonKnapp, ritaTillbaka, Knapp } from '../ui/Button';
import { stjarnRad } from '../ui/Stars';
import { DragScroll } from '../ui/DragScroll';
import { pratbubbla } from '../ui/Badge';

const X0 = avstand.sida;
const INNER_B = BREDD - avstand.sida * 2;
const RAD_H = 48;

export class SeasonScene extends BasScen {
  private scroll?: DragScroll;
  private kapitel!: Kapitel;

  constructor() {
    super('Sasong');
  }

  create(data?: { kapitel?: string }): void {
    this.kapitel = hamtaKapitel(data?.kapitel ?? '') ?? aktivtKapitel();
    sattAktivtKapitel(this.kapitel);
    this.forberedKamera('morkgron');
    ikonKnapp(this, 46, 48, 'konturMork', ritaTillbaka, () => this.bytTill('Map', { kapitel: this.kapitel.id }));

    const g = this.add.graphics();
    fyllStjarna(g, MITT_X, 170, 150, farg.lila);
    skapaText(this, MITT_X, 290, text.sasong.rubrik(this.kapitel.nummer), 'jatte', 'ljusbeige', { origo: [0.5, 0.5], storlek: 46 });
    const total = `${formatera(kapitelStjarnor(this.kapitel))} / ${kapitelMaxStjarnor(this.kapitel)}`;
    skapaText(this, MITT_X, 340, total, 'rubrik', 'guld', { origo: [0.5, 0.5], storlek: 28 });

    let y = this.ritaLista(380);
    y = this.ritaDela(y + avstand.l);
    y = this.ritaFortsatt(y + avstand.m);
    if (arSistaKapitlet(this.kapitel)) {
      skapaText(this, MITT_X, y + 40, text.sasong.nasta(this.kapitel.nummer + 1), 'overrubrik', 'beige', { origo: [0.5, 0.5], storlek: 13 });
    }
    this.scroll = new DragScroll(this, y + 80);
  }

  /** En rad per nivå: nummer, titel och stjärnor. Upplåsta nivåer går att spela om. */
  private ritaLista(y0: number): number {
    const nivaer = this.kapitel.nivaLista;
    nivaer.forEach((niva, i) => {
      const y = y0 + i * (RAD_H + 6);
      const rad = this.add.container(X0, y);
      // Upplåsta rader är gröna kort; låsta bara en kontur (i stället för genomskinliga, som gav för låg kontrast).
      const upplast = arUpplast(niva);
      const g = this.add.graphics();
      if (upplast) g.fillStyle(farg.gron, 1).fillRoundedRect(0, 0, INNER_B, RAD_H, radie.m);
      else g.lineStyle(1, farg.gron, 1).strokeRoundedRect(0, 0, INNER_B, RAD_H, radie.m);
      const nr = skapaText(this, 24, RAD_H / 2, String(niva.nummer), 'rubrik', upplast ? 'beige' : 'guld', { origo: [0.5, 0.5], storlek: 18 });
      const titel = skapaText(this, 48, RAD_H / 2, niva.titel, 'rubrik', 'ljusbeige', { origo: [0, 0.5], storlek: 17 });
      rad.add([g, nr, titel]);
      rad.add(stjarnRad(this, INNER_B - 44, RAD_H / 2, framsteg.stjarnor(niva.id) ?? 0, { storlek: 13, mellanrum: 3, fyllFarg: 'guld', konturFarg: 'beige' }));
      if (framsteg.harGuld(niva.id)) {
        g.fillStyle(farg.morkgron, 1).fillCircle(INNER_B - 12, RAD_H / 2, 9);
        fyllStjarna(g, INNER_B - 12, RAD_H / 2, 11, farg.guld);
      }
      if (!upplast) return;
      rad.setSize(INNER_B, RAD_H);
      rad.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, 0, INNER_B, RAD_H), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
      rad.on('pointerup', () => {
        if (!this.scroll?.arDrag()) this.bytTill('Level', { id: niva.id });
      });
    });
    return y0 + nivaer.length * (RAD_H + 6) - 6;
  }

  /** "Dela resultat": telefonens delningsfunktion, annars kopiera till urklipp. Visas bara om dela-länken finns. */
  private ritaDela(y: number): number {
    if (!lankar.dela) return y - avstand.l;
    const h = 56;
    new Knapp(this, MITT_X, y + h / 2, text.sasong.delaKnapp, { bredd: INNER_B, hojd: h, variant: 'guld', kanTryckas: () => !this.scroll?.arDrag() }, () =>
      void this.dela(y),
    );
    return y + h;
  }

  private async dela(y: number): Promise<void> {
    const delaText = text.sasong.delaText(formatera(kapitelStjarnor(this.kapitel)), kapitelMaxStjarnor(this.kapitel));
    const nav = navigator as Navigator & { share?: (d: { text?: string; url?: string }) => Promise<void> };
    try {
      if (nav.share) {
        await nav.share({ text: delaText, url: lankar.dela });
        return;
      }
      await navigator.clipboard.writeText(`${delaText} ${lankar.dela}`);
      const p = pratbubbla(this, MITT_X, y - 14, text.sasong.kopierat, 'lila', 'morkgron');
      this.tweens.add({ targets: p, alpha: 0, delay: 1400, duration: 300, onComplete: () => p.destroy() });
    } catch {
      // Användaren avbröt delningen, eller urklipp är inte tillåtet – inget att göra.
    }
  }

  /** "Fortsätt": grattis/"Kapitel klart" första gången kapitlet är klarat, annars kapitlets karta. */
  private ritaFortsatt(y: number): number {
    const h = 56;
    const k = this.kapitel;
    new Knapp(this, MITT_X, y + h / 2, text.sasong.fortsatt, { bredd: INNER_B, hojd: h, variant: 'konturMork', kanTryckas: () => !this.scroll?.arDrag() }, () => {
      if (arKapitelKlarat(k) && !framsteg.harSettKapitelKlart(k.id)) this.bytTill(arSistaKapitlet(k) ? 'Grattis' : 'KapitelKlart', { kapitel: k.id });
      else this.bytTill('Map', { kapitel: k.id });
    });
    return y + h;
  }
}

/** 26.5 -> "26,5" */
function formatera(antal: number): string {
  return antal.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
}
