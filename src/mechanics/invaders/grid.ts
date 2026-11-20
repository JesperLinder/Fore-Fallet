/**
 * Brickornas rutnät i invaders: en Formation (common/formation.ts) med bokstavsbrickor.
 * Här finns det som är invaders-specifikt: hur brickorna ser ut (enligt sin typ i brickor.typer),
 * reveal, ersättningar och fyllnadsanimationen.
 */
import Phaser from 'phaser';
import { farg, radie } from '../../config/theme';
import type { BrickData, BrickTyp, InvadersInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { Formation, type FormationsObjekt } from '../common/formation';
import { streckadRam } from '../../ui/shapes';
import { fyllnadsYta, ritaFigur } from '../art';

export type Bricka = FormationsObjekt<BrickData>;
type BrickInst = InvadersInstallningar['brickor'];

/** Brickor med figur: figuren ritas så här högt ovanför mitten, med etiketten under. */
const FIGUR_Y = -8;
const ETIKETT_H = 16;

export function brickTyp(inst: BrickInst, data: BrickData): BrickTyp {
  const t = inst.typer[data.typ];
  if (!t) console.warn(`Okänd bricktyp "${data.typ}" – lägg till den i brickor.typer`);
  return t ?? {};
}

function ritaBricka(scene: Phaser.Scene, data: BrickData, b: number, h: number, inst: BrickInst): Phaser.GameObjects.Container {
  const { ikon, figur } = inst;
  if (figur) {
    // Bara en figur, utan ruta och etikett (t.ex. ufon).
    const g = scene.add.graphics();
    ritaFigur(g, figur, 0, 0);
    return scene.add.container(0, 0, [g]);
  }
  if (data.dold) return ritaDold(scene, data.dold.etikett, b, h, ikon);
  const typ = brickTyp(inst, data);
  const g = scene.add.graphics();
  if (typ.figur) {
    // Figur med etiketten i liten text under, t.ex. en kolsyretub märkt "Ditt".
    ritaFigur(g, typ.figur, 0, FIGUR_Y, b, h - ETIKETT_H);
    const t = skapaText(scene, 0, h / 2 - 6, data.etikett, 'knapp', 'morkgron', { origo: [0.5, 0.5], storlek: 11 });
    return scene.add.container(0, 0, [g, t]);
  }
  const fel = (typ.stil ?? 'mork') === 'mork';
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
  constructor(
    scene: Phaser.Scene,
    private brickInst: BrickInst,
  ) {
    super(scene, brickInst, (s, d, b, h) => ritaBricka(s, d, b, h, brickInst));
  }

  typ(b: Bricka): BrickTyp {
    return brickTyp(this.brickInst, b.data);
  }

  get brickor(): Bricka[] {
    return this.objekt;
  }

  /**
   * Brickan som täcker punkten, om någon. Typer med "smalTraff" har en lite mindre träffyta än det som syns
   * (när de är avslöjade), så att ett skott som nästan går fri får gå igenom.
   */
  override traff(x: number, y: number): Bricka | undefined {
    return super.traff(x, y, (d) => (d.dold ? 0 : (brickTyp(this.brickInst, d).smalTraff ?? 0)));
  }

  /** Antal levande brickor vars typ har skaBort (vinstvillkoret "fel-borta"). */
  felKvar(): number {
    return this.objekt.filter((b) => b.levande && this.typ(b).skaBort).length;
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
   * Fyllning: brickan lämnar formationen, en ljus nivå stiger i figuren och den åker sedan ut uppåt.
   * Fyllnadsytan kommer från figuren (art.ts fyllnadsYta); figurer utan sådan fylls som hela brickan.
   */
  fyll(b: Bricka): void {
    b.levande = false;
    const obj = this.lyftUt(b);
    const typ = this.typ(b);
    const yta = (typ.figur && fyllnadsYta(typ.figur, this.brickInst.b, this.brickInst.h - ETIKETT_H)) || {
      x: -this.brickInst.b / 2,
      y: -this.brickInst.h / 2,
      b: this.brickInst.b,
      h: this.brickInst.h,
    };
    const offset = typ.figur ? FIGUR_Y : 0;
    const g = this.scene.add.graphics();
    obj.add(g);
    const niva = { t: 0 };
    this.scene.tweens.add({
      targets: niva,
      t: 1,
      duration: 380,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        const h = yta.h * niva.t;
        g.clear().fillStyle(farg.ljusbeige, 0.7).fillRect(yta.x, offset + yta.y + yta.h - h, yta.b, h);
      },
      onComplete: () => {
        this.scene.tweens.add({ targets: obj, y: obj.y - 260, alpha: 0, duration: 520, ease: 'Quad.easeIn', onComplete: () => obj.destroy() });
      },
    });
  }

  /**
   * Byter en bortskjuten bricka mot en ny med etiketten i "ersattning" och typen typ, på samma plats.
   * Den nya brickan får den gamlas "plats" i slutraden.
   */
  ersatt(gammal: Bricka, typ: string): Bricka | undefined {
    const etikett = gammal.data.ersattning;
    if (!etikett) return undefined;
    const ny = this.lagg({ etikett, typ, plats: gammal.data.plats }, gammal.lx, gammal.ly);
    ny.obj.setScale(0.4).setAlpha(0);
    this.scene.tweens.add({ targets: ny.obj, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    return ny;
  }
}
