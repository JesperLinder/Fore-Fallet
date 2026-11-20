/**
 * Kapitelvalet: mellan startskärmen och kartan. Ett kort per kapitel med nummer, titel, undertitel,
 * stjärnor (t.ex. "26,5 / 30") och status: klart, pågår eller låst. Ett kapitel låses upp när det
 * föregående är klarat (i testläget är alla upplåsta). Tryck på ett upplåst kort för att öppna dess karta.
 */
import Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { arMork, avstand, farg, radie, type FargNamn } from '../config/theme';
import { BREDD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import { allaKapitel, kapitelMaxStjarnor, kapitelStatus, kapitelStjarnor, type Kapitel, type KapitelStatus } from '../core/levels';
import { skapaText } from '../ui/text';
import { fyllStjarna, streckadRam } from '../ui/shapes';
import { ikonKnapp, ritaTillbaka } from '../ui/Button';
import { marke } from '../ui/Badge';
import { logotyp } from '../ui/Logo';
import { DragScroll } from '../ui/DragScroll';

const LISTA_Y = 164;
const KORT_H = 112;
const KORT_MELLANRUM = 12;
const KORT_X = avstand.sida;
const KORT_B = BREDD - avstand.sida * 2;

export class ChapterSelectScene extends BasScen {
  private scroll!: DragScroll;

  constructor() {
    super('Kapitel');
  }

  create(): void {
    this.forberedKamera('beige');
    ikonKnapp(this, 46, 48, 'konturLjus', ritaTillbaka, () => this.bytTill('Title'));
    logotyp(this, MITT_X, 48, 24, 'morkgron');
    skapaText(this, KORT_X, 96, text.kapitel.overrubrik, 'overrubrik', 'morkockra');
    skapaText(this, KORT_X - 2, 112, text.kapitel.rubrik, 'titel', 'morkgron');

    let y = LISTA_Y;
    for (const k of allaKapitel) y += this.ritaKort(k, y) + KORT_MELLANRUM;
    this.scroll = new DragScroll(this, y + avstand.xxl);
  }

  /** Ritar kapitlets kort och returnerar dess höjd. */
  private ritaKort(k: Kapitel, y: number): number {
    const status = kapitelStatus(k);
    const kort = this.add.container(KORT_X, y);
    // Bakgrunden ritas sist (när höjden är känd) i en egen grafik som ligger underst.
    const bg = this.add.graphics();
    const g = this.add.graphics();
    kort.add([bg, g]);

    // Nummercirkel i kapitlets accentfärg (låst: bara en ring).
    const cx = 40;
    const cy = KORT_H / 2;
    // Mörka accentfärger (t.ex. vinröd) får ljus siffra och, på det mörka "pågår"-kortet, en ljus ring runt.
    if (status === 'last') g.lineStyle(1, farg.morkgron, 1).strokeCircle(cx, cy, 26);
    else g.fillStyle(farg[k.farg], 1).fillCircle(cx, cy, 26);
    if (status === 'pagar' && arMork(k.farg)) g.lineStyle(1.5, farg.beige, 1).strokeCircle(cx, cy, 26);
    const nrFarg: FargNamn = status !== 'last' && arMork(k.farg) ? 'ljusbeige' : 'morkgron';
    kort.add(skapaText(this, cx, cy, String(k.nummer), 'rubrik', nrFarg, { origo: [0.5, 0.5], storlek: 22 }));

    const textFarg: FargNamn = status === 'pagar' ? 'ljusbeige' : 'morkgron';
    const x = 82;
    const textB = KORT_B - x - 16;
    kort.add(skapaText(this, x, 18, text.kapitel.nummer(k.nummer), 'overrubrik', status === 'pagar' ? 'guld' : 'morkockra', { storlek: 11 }));
    const titel = skapaText(this, x, 34, k.titel, 'rubrik', textFarg, { storlek: 21, bredd: textB });
    kort.add(titel);
    const under = skapaText(this, x, titel.y + titel.height + 2, k.undertitel, 'liten', textFarg, { bredd: textB });
    kort.add(under);

    // Längst ner: stjärnor till vänster, status till höger. En lång undertitel gör kortet högre.
    const ny = Math.max(KORT_H - 20, under.y + under.height + 16);
    const h = ny + 20;
    const stjarnFarg = status === 'pagar' ? farg.guld : farg.morkgron;
    fyllStjarna(g, x + 7, ny, 14, stjarnFarg);
    const stjarnor = `${formatera(kapitelStjarnor(k))} / ${kapitelMaxStjarnor(k)}`;
    kort.add(skapaText(this, x + 20, ny, stjarnor, 'knapp', textFarg, { origo: [0, 0.5], storlek: 14 }));
    const m = statusMarke(this, status);
    m.setPosition(KORT_B - 16 - m.width, ny);
    kort.add(m);

    // Samma formspråk som korten på kartan: klart = ljust kort, pågår = mörkt kort, låst = streckad ram.
    if (status === 'klart') bg.fillStyle(farg.ljusbeige, 1).fillRoundedRect(0, 0, KORT_B, h, radie.l);
    if (status === 'pagar') bg.fillStyle(farg.morkgron, 1).fillRoundedRect(0, 0, KORT_B, h, radie.l);
    if (status === 'last') streckadRam(bg, 0, 0, KORT_B, h, radie.l, farg.morkgron);

    kort.setSize(KORT_B, h);
    kort.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, KORT_B, h),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: status !== 'last',
    });
    kort.on('pointerup', () => {
      if (this.scroll.arDrag()) return;
      if (status === 'last') this.tweens.add({ targets: kort, x: kort.x + 6, duration: 50, yoyo: true, repeat: 2 });
      else this.bytTill('Map', { kapitel: k.id });
    });
    return h;
  }
}

function statusMarke(scene: Phaser.Scene, status: KapitelStatus): Phaser.GameObjects.Container {
  if (status === 'klart') return marke(scene, 0, 0, text.kapitel.status.klart, 'morkgron', 'ljusbeige');
  if (status === 'pagar') return marke(scene, 0, 0, text.kapitel.status.pagar, 'guld', 'morkgron');
  return marke(scene, 0, 0, text.kapitel.status.last, 'beige', 'morkgron');
}

/** 26.5 -> "26,5" */
function formatera(antal: number): string {
  return antal.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
}
