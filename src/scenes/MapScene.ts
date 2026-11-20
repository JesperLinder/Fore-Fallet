/**
 * Rättsfallskartan: listan med alla nivåer. Läser nivåerna från src/levels/ och visar
 * avklarade (med stjärnor), nästa spelbara (mörkt kort) och låsta (streckade) nivåer.
 */
import Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { avstand, farg, radie } from '../config/theme';
import { BREDD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import { allaNivaer, arUpplast, maxTotalaStjarnor } from '../core/levels';
import type { Niva, NivaPlatshallare } from '../core/levelTypes';
import { framsteg } from '../core/progress';
import { skapaText } from '../ui/text';
import { fyllStjarna, streckadRam } from '../ui/shapes';
import { ikonKnapp, ritaTillbaka, ritaLjud } from '../ui/Button';
import { stjarnRad } from '../ui/Stars';
import { marke } from '../ui/Badge';
import { DragScroll } from '../ui/DragScroll';
import { logotyp } from '../ui/Logo';
import { ljud, spela } from '../core/sound';

const LISTA_Y = 164;
const KORT_H = 68;
const KORT_MELLANRUM = 9;
const KORT_X = avstand.sida;
const KORT_B = BREDD - avstand.sida * 2;

type KortLage = 'klar' | 'nasta' | 'last';

export class MapScene extends BasScen {
  private scroll!: DragScroll;

  constructor() {
    super('Map');
  }

  create(): void {
    this.forberedKamera('beige');
    this.ritaSidhuvud();

    let y = LISTA_Y;
    allaNivaer.forEach((niva) => {
      this.ritaKort(niva, y);
      y += KORT_H + KORT_MELLANRUM;
    });
    y = this.ritaInforuta(y + 40);

    this.scroll = new DragScroll(this, y + avstand.xxl);
  }

  private ritaSidhuvud(): void {
    ikonKnapp(this, 46, 48, 'konturLjus', ritaTillbaka, () => this.bytTill('Title'));
    this.ritaLjudknapp();
    logotyp(this, MITT_X, 48, 24, 'morkgron');

    // Stjärnräknare uppe till höger.
    const raknare = skapaText(this, 0, 0, `${formateraStjarnor(framsteg.totalaStjarnor())} / ${maxTotalaStjarnor()}`, 'knapp', 'ljusbeige', {
      origo: [0, 0.5],
      storlek: 15,
    });
    const b = raknare.width + 48;
    const x = BREDD - avstand.sida - b;
    const g = this.add.graphics().fillStyle(farg.morkgron, 1).fillRoundedRect(x, 30, b, 36, 18);
    fyllStjarna(g, x + 20, 48, 14, farg.lila);
    raknare.setPosition(x + 32, 48).setDepth(1);

    skapaText(this, KORT_X, 96, text.karta.overrubrik, 'overrubrik', 'morkockra');
    skapaText(this, KORT_X - 2, 112, text.karta.rubrik, 'titel', 'morkgron');
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
    const typ = niva.etikett ?? text.mekanikNamn[niva.mekanik] ?? niva.mekanik;
    const referens = skapaText(this, 72, 46, `${niva.referens} · ${typ}`, 'liten', textFarg, { origo: [0, 0.5] });
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
    if (lage === 'last' && niva.etikett) {
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

function kortLage(niva: NivaPlatshallare | Niva): KortLage {
  if (framsteg.arKlar(niva.id)) return 'klar';
  return arUpplast(niva) ? 'nasta' : 'last';
}

/** 9 -> "9", 1.5 -> "1,5" (halva stjärnor kan finnas i gamla sparningar) */
function formateraStjarnor(antal: number): string {
  return antal.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
}
