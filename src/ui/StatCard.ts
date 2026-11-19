/** Ruta i nivåns resultatrad: en liten rubrik och ett innehåll (mätare, prickar eller belopp). */
import Phaser from 'phaser';
import { farg, radie } from '../config/theme';
import { skapaText } from './text';

export class StatKort extends Phaser.GameObjects.Container {
  readonly innehall: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, b: number, h: number, rubrik: string, centrerad = false) {
    super(scene, x, y);
    const g = scene.add.graphics().fillStyle(farg.beige, 1).fillRoundedRect(0, 0, b, h, radie.m);
    const r = skapaText(scene, centrerad ? b / 2 : 12, 12, rubrik, 'etikett', 'morkgron', {
      origo: [centrerad ? 0.5 : 0, 0],
      storlek: 11,
    });
    this.innehall = scene.add.container(centrerad ? b / 2 : 12, 40);
    this.add([g, r, this.innehall]);
    scene.add.existing(this);
  }
}

/** Liggande mätare 0–100. Returnerar en funktion som uppdaterar värdet. */
export function matare(scene: Phaser.Scene, kort: StatKort, bredd: number): (varde: number) => void {
  const g = scene.add.graphics();
  kort.innehall.add(g);
  return (varde: number) => {
    const andel = Phaser.Math.Clamp(varde, 0, 100) / 100;
    g.clear();
    g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(0, -3, bredd, 7, 3.5);
    if (andel > 0) {
      g.fillStyle(andel > 0.3 ? farg.morkgron : farg.vinrod, 1);
      g.fillRoundedRect(0, -3, Math.max(bredd * andel, 7), 7, 3.5);
    }
  };
}

/** Prickar som visar hur många skott som återstår. Returnerar en uppdateringsfunktion. */
export function prickar(scene: Phaser.Scene, kort: StatKort, antal: number): (kvar: number) => void {
  const g = scene.add.graphics();
  kort.innehall.add(g);
  const avst = 13;
  return (kvar: number) => {
    g.clear();
    for (let i = 0; i < antal; i++) {
      const x = (i - (antal - 1) / 2) * avst;
      if (i < kvar) g.fillStyle(farg.morkgron, 1).fillCircle(x, 0, 4);
      else g.lineStyle(1, farg.morkgron, 1).strokeCircle(x, 0, 3.5);
    }
  };
}
