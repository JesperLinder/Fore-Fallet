/**
 * Brickornas rutnät i invaders: en Formation (common/formation.ts) med bokstavsbrickor.
 * Här finns det som är invaders-specifikt: hur brickorna ser ut, fel/rätt och ersättningar.
 */
import Phaser from 'phaser';
import { farg, radie } from '../../config/theme';
import type { BrickData, InvadersInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { Formation, type FormationsObjekt } from '../common/formation';

/** Hur mycket rätt-brickornas träffyta krymps på varje sida (punkter). */
const FORLATANDE_KANT = 3;

export type Bricka = FormationsObjekt<BrickData>;

function ritaBricka(scene: Phaser.Scene, data: BrickData, b: number, h: number): Phaser.GameObjects.Container {
  const fel = data.typ === 'fel';
  const g = scene.add.graphics();
  g.fillStyle(fel ? farg.vinrod : farg.beige, 1).fillRoundedRect(-b / 2, -h / 2, b, h, radie.s);
  if (fel) g.lineStyle(1.5, farg.lila, 1).strokeRoundedRect(-b / 2, -h / 2, b, h, radie.s);
  const t = skapaText(scene, 0, 1, data.etikett, 'rubrik', fel ? 'ljusbeige' : 'morkgron', {
    origo: [0.5, 0.5],
    storlek: data.etikett.length > 2 ? 15 : 26,
  });
  return scene.add.container(0, 0, [g, t]);
}

export class Rutnat extends Formation<BrickData> {
  constructor(scene: Phaser.Scene, inst: InvadersInstallningar['brickor']) {
    super(scene, inst, ritaBricka);
  }

  get brickor(): Bricka[] {
    return this.objekt;
  }

  /**
   * Brickan som täcker punkten, om någon. Rätt-brickornas träffyta är lite mindre än det som syns,
   * så att ett skott som nästan går fri från en rätt-bricka får gå igenom.
   */
  override traff(x: number, y: number): Bricka | undefined {
    return super.traff(x, y, (d) => (d.typ === 'ratt' ? FORLATANDE_KANT : 0));
  }

  felKvar(): number {
    return this.objekt.filter((b) => b.levande && b.data.typ === 'fel').length;
  }

  /**
   * Byter en bortskjuten fel-bricka mot en rätt-bricka med etiketten i "ersattning", på samma plats.
   * Den nya brickan får fel-brickans "plats" i slutraden och räknas som rätt (får inte skjutas).
   */
  ersatt(gammal: Bricka): Bricka | undefined {
    const etikett = gammal.data.ersattning;
    if (!etikett) return undefined;
    const ny = this.lagg({ etikett, typ: 'ratt', plats: gammal.data.plats }, gammal.lx, gammal.ly);
    ny.obj.setScale(0.4).setAlpha(0);
    this.scene.tweens.add({ targets: ny.obj, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    return ny;
  }
}
