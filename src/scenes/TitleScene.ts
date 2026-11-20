/**
 * Startskärmen: Fylgia uppe till vänster, stor lila fyruddig stjärna som långsamt roterar (ett varv på 20 s),
 * "Före fallet", "Ett prejudikatspel" och raden om fylgian. "Spela" tar en ny spelare direkt till första
 * nivån, annars till kartan. "Om spelet" öppnar Om-skärmen.
 */
import Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { avstand, farg } from '../config/theme';
import { BREDD, MITT_X } from '../config/display';
import { allaNivaer } from '../core/levels';
import { framsteg } from '../core/progress';
import { text } from '../config/strings';
import { skapaText } from '../ui/text';
import { fyllStjarna, streckadLinje } from '../ui/shapes';
import { Knapp } from '../ui/Button';
import { logotyp } from '../ui/Logo';

const STJARNA_Y = 270;

export class TitleScene extends BasScen {
  constructor() {
    super('Title');
  }

  create(): void {
    this.forberedKamera('morkgron');

    logotyp(this, avstand.sida + 8, 50, 26, 'beige', 'logotyp', [0, 0.5]);

    this.ritaEmblem();

    skapaText(this, MITT_X, 470, text.titel.rubrik, 'jatte', 'beige', { origo: [0.5, 0.5] });
    skapaText(this, MITT_X, 520, text.titel.underrubrik, 'ingress', 'beige', { origo: [0.5, 0.5], storlek: 22 });
    skapaText(this, MITT_X, 584, text.titel.rad, 'brod', 'beige', {
      origo: [0.5, 0.5],
      bredd: 260,
      justering: 'center',
    });

    const b = BREDD - avstand.sida * 2 - 8;
    new Knapp(this, MITT_X, 690, text.titel.spela, { bredd: b, hojd: 56, variant: 'guld' }, () => this.spela());
    new Knapp(this, MITT_X, 758, text.titel.omSpelet, { bredd: b, hojd: 56, variant: 'konturMork' }, () => this.bytTill('Om'));
  }

  /** En ny spelare (inga sparade resultat) går direkt till första nivån, andra till kapitelvalet. */
  private spela(): void {
    const ny = allaNivaer.every((n) => !framsteg.arKlar(n.id));
    if (ny) this.bytTill('Level', { id: allaNivaer[0].id });
    else this.bytTill('Kapitel');
  }

  /** Den stora stjärnan med ringar runt, som i mockupen. */
  private ritaEmblem(): void {
    const ringar = this.add.graphics();
    ringar.lineStyle(1, farg.gron, 1).strokeCircle(MITT_X, STJARNA_Y, 140);

    // Prickad inre ring som sakta roterar.
    const prickRing = this.add.graphics({ x: MITT_X, y: STJARNA_Y });
    prickRing.lineStyle(1.5, farg.gron, 1);
    const punkter = Array.from({ length: 121 }, (_, i) => {
      const v = (i / 120) * Math.PI * 2;
      return new Phaser.Math.Vector2(Math.cos(v) * 104, Math.sin(v) * 104);
    });
    streckadLinje(prickRing, punkter, 1.5, 5);
    this.tweens.add({ targets: prickRing, angle: 360, duration: 60000, repeat: -1 });

    // Guldprick på banan runt stjärnan och en liten guldtriangel.
    const prick = this.add.graphics().fillStyle(farg.guld, 1).fillCircle(0, 0, 5);
    const bana = { v: -0.75 };
    this.tweens.add({
      targets: bana,
      v: -0.75 + Math.PI * 2,
      duration: 24000,
      repeat: -1,
      onUpdate: () => prick.setPosition(MITT_X + Math.cos(bana.v) * 122, STJARNA_Y + Math.sin(bana.v) * 122),
    });
    this.add.graphics().fillStyle(farg.guld, 1).fillTriangle(103, STJARNA_Y + 76, 119, STJARNA_Y + 76, 111, STJARNA_Y + 89);

    const stjarna = this.add.graphics({ x: MITT_X, y: STJARNA_Y });
    fyllStjarna(stjarna, 0, 0, 216, farg.lila);
    // Ett varv på 20 sekunder.
    this.tweens.add({ targets: stjarna, angle: 360, duration: 20000, repeat: -1 });
  }
}
