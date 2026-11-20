/**
 * Kapitelvalet: mellan startskärmen och kartan. Ett kort per kapitel med nummer, titel, undertitel,
 * stjärnor (t.ex. "26,5 / 30") och status: klart, pågår eller låst. Ett kapitel låses upp när det
 * föregående är klarat (i testläget är alla upplåsta). Tryck på ett upplåst kort för att öppna dess karta.
 */
import Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { avstand, farg, radie, type FargNamn } from '../config/theme';
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
    for (const k of allaKapitel) {
      this.ritaKort(k, y);
      y += KORT_H + KORT_MELLANRUM;
    }
    this.scroll = new DragScroll(this, y + avstand.xxl);
  }

  private ritaKort(k: Kapitel, y: number): void {
    const status = kapitelStatus(k);
    const kort = this.add.container(KORT_X, y);
    const g = this.add.graphics();
    kort.add(g);

    // Samma formspråk som korten på kartan: klart = ljust kort, pågår = mörkt kort, låst = streckad ram.
    if (status === 'klart') g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(0, 0, KORT_B, KORT_H, radie.l);
    if (status === 'pagar') g.fillStyle(farg.morkgron, 1).fillRoundedRect(0, 0, KORT_B, KORT_H, radie.l);
    if (status === 'last') streckadRam(g, 0, 0, KORT_B, KORT_H, radie.l, farg.morkgron);

    // Nummercirkel i kapitlets accentfärg (låst: bara en ring).
    const cx = 40;
    const cy = KORT_H / 2;
    if (status === 'last') g.lineStyle(1, farg.morkgron, 1).strokeCircle(cx, cy, 26);
    else g.fillStyle(farg[k.farg], 1).fillCircle(cx, cy, 26);
    kort.add(skapaText(this, cx, cy, String(k.nummer), 'rubrik', 'morkgron', { origo: [0.5, 0.5], storlek: 22 }));

    const textFarg: FargNamn = status === 'pagar' ? 'ljusbeige' : 'morkgron';
    const x = 82;
    const textB = KORT_B - x - 16;
    kort.add(skapaText(this, x, 18, text.kapitel.nummer(k.nummer), 'overrubrik', status === 'pagar' ? 'guld' : 'morkockra', { storlek: 11 }));
    const titel = skapaText(this, x, 34, k.titel, 'rubrik', textFarg, { storlek: 21, bredd: textB });
    kort.add(titel);
    kort.add(skapaText(this, x, titel.y + titel.height + 2, k.undertitel, 'liten', textFarg, { bredd: textB }));

    // Längst ner: stjärnor till vänster, status till höger.
    const ny = KORT_H - 20;
    const stjarnFarg = status === 'pagar' ? farg.guld : farg.morkgron;
    fyllStjarna(g, x + 7, ny, 14, stjarnFarg);
    const stjarnor = `${formatera(kapitelStjarnor(k))} / ${kapitelMaxStjarnor(k)}`;
    kort.add(skapaText(this, x + 20, ny, stjarnor, 'knapp', textFarg, { origo: [0, 0.5], storlek: 14 }));
    const m = statusMarke(this, status);
    m.setPosition(KORT_B - 16 - m.width, ny);
    kort.add(m);

    kort.setSize(KORT_B, KORT_H);
    kort.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, KORT_B, KORT_H),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: status !== 'last',
    });
    kort.on('pointerup', () => {
      if (this.scroll.arDrag()) return;
      if (status === 'last') this.tweens.add({ targets: kort, x: kort.x + 6, duration: 50, yoyo: true, repeat: 2 });
      else this.bytTill('Map', { kapitel: k.id });
    });
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
