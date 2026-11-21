/**
 * Rättsfallskartan: ett kapitel i taget. Överst kapitlets nummer, undertitel och titel och en bakåtknapp till
 * kapitelvalet; sedan kapitlets nivåer: avklarade (med stjärnor), nästa spelbara (mörkt kort) och låsta (streckade).
 * Vilket kapitel: { kapitel: id } när scenen startas, annars det som senast visades.
 */
import Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { arMork, avstand, farg, radie, type FargNamn } from '../config/theme';
import { BREDD, MITT_X } from '../config/display';
import { text } from '../config/strings';
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
import type { Niva, NivaPlatshallare } from '../core/levelTypes';
import { framsteg } from '../core/progress';
import { skapaText } from '../ui/text';
import { fyllStjarna, streckadRam } from '../ui/shapes';
import { ikonKnapp, ritaTillbaka, ritaLjud, Knapp } from '../ui/Button';
import { stjarnRad } from '../ui/Stars';
import { marke } from '../ui/Badge';
import { DragScroll } from '../ui/DragScroll';
import { logotyp } from '../ui/Logo';
import { ljud, spela } from '../core/sound';
import { testlage } from '../debug/flaggor';
import { testknapparKarta } from '../debug/Testpanel';

const LISTA_Y = 164;
const KORT_H = 68;
const KORT_MELLANRUM = 9;
const KORT_X = avstand.sida;
const KORT_B = BREDD - avstand.sida * 2;

type KortLage = 'klar' | 'nasta' | 'last';

export interface KartData {
  kapitel?: string;
}

export class MapScene extends BasScen {
  private scroll!: DragScroll;
  private kapitel!: Kapitel;

  constructor() {
    super('Map');
  }

  create(data?: KartData): void {
    this.kapitel = hamtaKapitel(data?.kapitel ?? '') ?? aktivtKapitel();
    sattAktivtKapitel(this.kapitel);
    this.forberedKamera('beige');
    this.ritaSidhuvud();

    let y = LISTA_Y;
    this.kapitel.nivaLista.forEach((niva) => {
      this.ritaKort(niva, y);
      y += KORT_H + KORT_MELLANRUM;
    });
    y = this.ritaInforuta(y + 40);
    if (arKapitelKlarat(this.kapitel)) y = this.ritaGrattisknapp(y + avstand.m);
    if (testlage) y = testknapparKarta(this, y + avstand.l, () => this.scene.restart());

    this.scroll = new DragScroll(this, y + avstand.xxl);
  }

  private ritaSidhuvud(): void {
    ikonKnapp(this, 46, 48, 'konturLjus', ritaTillbaka, () => this.bytTill('Kapitel'));
    this.ritaLjudknapp();
    logotyp(this, MITT_X, 48, 24, 'morkgron');

    // Stjärnräknare uppe till höger (kapitlets stjärnor).
    const k = this.kapitel;
    const raknare = skapaText(this, 0, 0, `${formateraStjarnor(kapitelStjarnor(k))} / ${kapitelMaxStjarnor(k)}`, 'knapp', 'ljusbeige', {
      origo: [0, 0.5],
      storlek: 15,
    });
    const b = raknare.width + 48;
    const x = BREDD - avstand.sida - b;
    const g = this.add.graphics().fillStyle(farg.morkgron, 1).fillRoundedRect(x, 30, b, 36, 18);
    fyllStjarna(g, x + 20, 48, 14, farg.lila);
    raknare.setPosition(x + 32, 48).setDepth(1);

    // En lång undertitel bryts på två rader och flyttas upp en bit, så att titeln står kvar på samma plats.
    const over = skapaText(this, KORT_X, 96, text.karta.overrubrik(k.nummer, k.undertitel), 'overrubrik', 'morkockra', { bredd: KORT_B });
    if (over.height > 20) over.setY(110 - over.height);
    skapaText(this, KORT_X - 2, 112, k.titel, 'titel', 'morkgron');
  }

  /** Ljud av/på. Valet sparas och gäller i hela spelet. */
  private ritaLjudknapp(): void {
    const knapp = ikonKnapp(this, 102, 48, 'konturLjus', ritaLjud(ljud.arPa()), () => {
      ljud.sattPa(!ljud.arPa());
      knapp.destroy();
      this.ritaLjudknapp();
      spela('fanga');
    });
    knapp.setName(ljud.arPa() ? text.installningar.ljudPa : text.installningar.ljudAv);
  }

  private ritaKort(niva: NivaPlatshallare | Niva, y: number): void {
    const lage = kortLage(niva);
    const kort = this.add.container(KORT_X, y);
    const g = this.add.graphics();
    kort.add(g);

    if (lage === 'klar') g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(0, 0, KORT_B, KORT_H, radie.l);
    if (lage === 'nasta') g.fillStyle(farg.morkgron, 1).fillRoundedRect(0, 0, KORT_B, KORT_H, radie.l);
    if (lage === 'last') streckadRam(g, 0, 0, KORT_B, KORT_H, radie.l, farg.morkgron);

    // Nummercirkel.
    const cx = 36;
    const cy = KORT_H / 2;
    if (lage === 'klar') g.fillStyle(farg.morkgron, 1).fillCircle(cx, cy, 23);
    if (lage === 'nasta') g.fillStyle(farg.guld, 1).fillCircle(cx, cy, 23);
    if (lage === 'last') g.lineStyle(1, farg.morkgron, 1).strokeCircle(cx, cy, 23);
    const nummerFarg = lage === 'klar' ? 'ljusbeige' : 'morkgron';
    kort.add(skapaText(this, cx, cy, String(niva.nummer), 'rubrik', nummerFarg, { origo: [0.5, 0.5] }));

    // Titel, referens och mekanik.
    const textFarg = lage === 'nasta' ? 'ljusbeige' : 'morkgron';
    const titel = skapaText(this, 72, 22, niva.titel, 'rubrik', textFarg, { origo: [0, 0.5], storlek: 19 });
    // En lång titel på en låst "kommer snart"-nivå krymps så att den inte går in i texten till höger.
    const titelMax = KORT_B - 72 - 80;
    if (niva.kommerSnart && titel.width > titelMax) titel.setFontSize(Math.max(14, Math.floor((19 * titelMax) / titel.width)));
    // Rättsområdet (kapitel 2 och framåt) står efter referensen i stället för mekanikens namn.
    const typ = niva.rattsomrade ?? niva.etikett ?? text.mekanikNamn[niva.mekanik] ?? niva.mekanik;
    const referens = skapaText(this, 72, 46, niva.referens ? `${niva.referens} · ${typ}` : typ, 'liten', textFarg, { origo: [0, 0.5] });
    kort.add([titel, referens]);
    // Stjärnorna/"Spela" står mitt i höjdled, eller på titelraden om märket fått flytta ner.
    let hogerY = KORT_H / 2;
    // Tagen guldstjärna: en liten medaljong längst till höger; stjärnorna flyttar då in en bit.
    const guld = lage === 'klar' && framsteg.harGuld(niva.id);
    const stjarnX = guld ? KORT_B - 56 : KORT_B - 40;
    if (niva.fylgiaMal) {
      // Märket står efter titeln, eller efter referensraden om det annars krockar med stjärnorna/"Spela".
      const m = marke(this, titel.x + titel.width + 8, 22, text.karta.fylgiaMal);
      const hogerGrans = KORT_B - (lage === 'last' && !niva.etikett ? 16 : guld ? 92 : 76);
      if (m.x + m.width > hogerGrans) {
        m.setPosition(referens.x + referens.width + 8, 46);
        hogerY = 22;
      }
      kort.add(m);
    }

    if (niva.kartmarke) {
      // Märket ("Memory", "Boss") efter titeln, eller efter referensraden om det inte får plats. Flera märken
      // (t.ex. "Boss" och "Final") står i rad med ett litet mellanrum.
      const hogerGrans = KORT_B - (niva.kommerSnart && lage === 'last' ? 74 : guld ? 92 : 76);
      const lista = Array.isArray(niva.kartmarke) ? niva.kartmarke : [niva.kartmarke];
      const marken = lista.map((mk) => marke(this, 0, 22, mk.text, mk.farg, morkText(mk.farg)));
      const bredd = marken.reduce((summa, m) => summa + m.width, 0) + (marken.length - 1) * 6;
      const placera = (x: number, y: number): void => {
        let mx = x;
        for (const m of marken) {
          m.setPosition(mx, y);
          mx += m.width + 6;
        }
      };
      placera(titel.x + titel.width + 8, 22);
      if (titel.x + titel.width + 8 + bredd > hogerGrans) {
        placera(referens.x + referens.width + 8, 46);
        if (referens.x + referens.width + 8 + bredd > hogerGrans) {
          // Får inte plats någonstans: kortare referensrad (utan rättsområdet).
          referens.setText(niva.referens ?? '');
          placera(referens.x + referens.width + 8, 46);
        }
      }
      kort.add(marken);
    }

    // Höger sida: stjärnor eller "Spela".
    if (lage === 'klar') {
      kort.add(stjarnRad(this, stjarnX, hogerY, framsteg.stjarnor(niva.id) ?? 0, {
        storlek: 12,
        mellanrum: 2,
        fyllFarg: 'morkgron',
        konturFarg: 'morkgron',
      }));
      if (guld) {
        g.fillStyle(farg.morkgron, 1).fillCircle(KORT_B - 22, hogerY, 10);
        fyllStjarna(g, KORT_B - 22, hogerY, 12, farg.guld);
      }
    }
    if (lage === 'nasta') {
      kort.add(skapaText(this, KORT_B - 18, hogerY, text.karta.spela, 'overrubrik', 'guld', { origo: [1, 0.5] }));
    }
    // Låsta nivåer med etikett (t.ex. "Boss", "Final") visar den till höger, som i mockupen.
    if (lage === 'last' && niva.kommerSnart) {
      kort.add(skapaText(this, KORT_B - 18, KORT_H / 2, text.karta.kommerSnart.toUpperCase().replace(' ', '\n'), 'overrubrik', 'morkockra', { origo: [1, 0.5], justering: 'right', storlek: 10 }));
    } else if (lage === 'last' && niva.etikett) {
      kort.add(skapaText(this, KORT_B - 18, hogerY, niva.etikett.toUpperCase(), 'overrubrik', 'morkockra', { origo: [1, 0.5] }));
    }

    kort.setSize(KORT_B, KORT_H);
    kort.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, KORT_B, KORT_H),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: lage !== 'last',
    });
    kort.on('pointerup', () => {
      if (this.scroll.arDrag()) return;
      if (arUpplast(niva)) this.bytTill('Level', { id: niva.id });
      else this.skaka(kort);
    });
  }

  /**
   * Liten knapp när kapitlet är klarat: till grattisskärmen efter det sista kapitlet, annars till "Kapitel klart".
   */
  private ritaGrattisknapp(y: number): number {
    const h = 44;
    const sista = arSistaKapitlet(this.kapitel);
    const etikett = sista ? text.grattis.kartknapp : text.kapitelKlart.kartknapp;
    const k = new Knapp(this, MITT_X, y + h / 2, etikett, { bredd: KORT_B, hojd: h, variant: 'konturLjus', kanTryckas: () => !this.scroll.arDrag() }, () =>
      this.bytTill(sista ? 'Grattis' : 'KapitelKlart', { kapitel: this.kapitel.id }),
    );
    const g = this.add.graphics();
    fyllStjarna(g, 0, 0, 16, farg.lila);
    k.addAt(g, 1);
    g.setX(-k.width / 2 + 24);
    return y + h;
  }

  private ritaInforuta(y: number): number {
    const b = KORT_B;
    const t = skapaText(this, KORT_X + 62, y + 18, text.karta.info, 'brod', 'morkgron', { bredd: b - 62 - 20, storlek: 14 });
    const h = t.height + 36;
    const g = this.add.graphics().fillStyle(farg.ljusbeige, 1).fillRoundedRect(KORT_X, y, b, h, radie.l);
    fyllStjarna(g, KORT_X + 32, y + h / 2, 26, farg.lila);
    t.setDepth(1);
    return y + h;
  }

  /** Liten skakning när man trycker på en låst nivå. */
  private skaka(mal: Phaser.GameObjects.Container): void {
    this.tweens.add({ targets: mal, x: mal.x + 6, duration: 50, yoyo: true, repeat: 2 });
  }
}

/** Text på ett märke: mörkgrön på ljusa färger, ljusbeige på mörka. */
function morkText(bakgrund: FargNamn): FargNamn {
  return arMork(bakgrund) ? 'ljusbeige' : 'morkgron';
}

function kortLage(niva: NivaPlatshallare | Niva): KortLage {
  if (framsteg.arKlar(niva.id)) return 'klar';
  return arUpplast(niva) ? 'nasta' : 'last';
}

/** 9 -> "9", 1.5 -> "1,5" (halva stjärnor kan finnas i gamla sparningar) */
function formateraStjarnor(antal: number): string {
  return antal.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
}
