/**
 * Brickornas rutnät i invaders: en Formation (common/formation.ts) med bokstavsbrickor.
 * Här finns det som är invaders-specifikt: hur brickorna ser ut, fel/rätt och ersättningar.
 */
import Phaser from 'phaser';
import { farg, radie } from '../../config/theme';
import type { BrickData, InvadersInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { Formation, type FormationsObjekt } from '../common/formation';
import { streckadRam } from '../../ui/shapes';
import { ritaFigur } from '../art';

/** Hur mycket rätt-brickornas träffyta krymps på varje sida (punkter). */
const FORLATANDE_KANT = 3;

export type Bricka = FormationsObjekt<BrickData>;

function ritaBricka(scene: Phaser.Scene, data: BrickData, b: number, h: number, ikon?: string): Phaser.GameObjects.Container {
  if (data.dold) return ritaDold(scene, data.dold.etikett, b, h, ikon);
  const fel = data.typ === 'fel';
  const g = scene.add.graphics();
  if (ikon && !fel) {
    // Avslöjad rätt-bricka med ikon: grön, som "Säljare = ägare".
    g.fillStyle(farg.gron, 1).fillRoundedRect(-b / 2, -h / 2, b, h, radie.s);
    return ikonOchText(scene, g, ikon, farg.beige, data.etikett, 'ljusbeige', h);
  }
  g.fillStyle(fel ? farg.vinrod : farg.beige, 1).fillRoundedRect(-b / 2, -h / 2, b, h, radie.s);
  if (fel) g.lineStyle(1.5, farg.lila, 1).strokeRoundedRect(-b / 2, -h / 2, b, h, radie.s);
  if (ikon) return ikonOchText(scene, g, ikon, farg.ljusbeige, data.etikett, 'ljusbeige', h);
  const t = skapaText(scene, 0, 1, data.etikett, 'rubrik', fel ? 'ljusbeige' : 'morkgron', {
    origo: [0.5, 0.5],
    storlek: data.etikett.length > 2 ? 15 : 26,
  });
  return scene.add.container(0, 0, [g, t]);
}

/** Okänd bricka (reveal): streckad beige kontur, guldfärgad ikon och etiketten, t.ex. "Ej kontrollerad". */
function ritaDold(scene: Phaser.Scene, etikett: string, b: number, h: number, ikon?: string): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  streckadRam(g, -b / 2, -h / 2, b, h, radie.s, farg.beige);
  if (ikon) return ikonOchText(scene, g, ikon, farg.guld, etikett, 'ljusbeige', h);
  g.fillStyle(farg.guld, 1).fillCircle(0, -8, 5);
  const t = skapaText(scene, 0, h / 2 - 14, etikett, 'knapp', 'ljusbeige', { origo: [0.5, 0.5], storlek: 11 });
  return scene.add.container(0, 0, [g, t]);
}

function ikonOchText(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  ikon: string,
  ikonFarg: number,
  etikett: string,
  textFarg: 'ljusbeige' | 'morkgron',
  h: number,
): Phaser.GameObjects.Container {
  ritaFigur(g, ikon, 0, -h * 0.14, 44, 22, ikonFarg);
  const t = skapaText(scene, 0, h * 0.27, etikett, 'knapp', textFarg, { origo: [0.5, 0.5], storlek: 12 });
  return scene.add.container(0, 0, [g, t]);
}

export class Rutnat extends Formation<BrickData> {
  constructor(scene: Phaser.Scene, inst: InvadersInstallningar['brickor']) {
    super(scene, inst, (s, d, b, h) => ritaBricka(s, d, b, h, inst.ikon));
  }

  get brickor(): Bricka[] {
    return this.objekt;
  }

  /**
   * Brickan som täcker punkten, om någon. Rätt-brickornas träffyta är lite mindre än det som syns,
   * så att ett skott som nästan går fri från en rätt-bricka får gå igenom.
   */
  override traff(x: number, y: number): Bricka | undefined {
    return super.traff(x, y, (d) => (d.typ === 'ratt' && !d.dold ? FORLATANDE_KANT : 0));
  }

  felKvar(): number {
    return this.objekt.filter((b) => b.levande && b.data.typ === 'fel').length;
  }

  /** Sant när varje bricka är bortskjuten eller släppt igenom. */
  allaKlara(): boolean {
    return this.objekt.every((b) => !b.levande);
  }

  /** Reveal: visar brickans riktiga typ och etikett med en kort stämpelanimation. Brickan ligger kvar. */
  avsloja(b: Bricka): void {
    b.data = { ...b.data, dold: undefined };
    this.scene.tweens.add({
      targets: b.obj,
      scale: 0.82,
      duration: 70,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.ritaOm(b);
        this.scene.tweens.add({ targets: b.obj, scale: 1, duration: 260, ease: 'Back.easeOut' });
      },
    });
  }

  /** Brickan har nått spelaren och släpps igenom: glider ner och tonar bort. */
  slappIgenom(b: Bricka): void {
    b.levande = false;
    this.scene.tweens.add({ targets: b.obj, y: b.obj.y + 40, alpha: 0, duration: 350, onComplete: () => b.obj.destroy() });
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
