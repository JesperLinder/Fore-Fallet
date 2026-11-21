/**
 * Ström av fångstobjekt i invaders (t.ex. kunder till kassan, eller kalenderblad i Semesterdagarna).
 * Objekten släpps uppifrån med jämna mellanrum på slumpvis x. Varje objekt har en typ (strom.typer) med
 * eget utseende och egna regler (onFangst, onPass) som Invaders.ts tillämpar.
 * "antal" ger en bestämd omgång i slumpad ordning; "vikter" en oändlig slumpad ström.
 */
import Phaser from 'phaser';
import { BREDD } from '../../config/display';
import { arMork, avstand, farg } from '../../config/theme';
import type { FangstStrom, FangstTyp } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { ritaFigur } from '../art';

/** Fladder: svängning i sidled (punkter) och vickning (grader), och hur fort. */
const FLADDER_X = 10;
const FLADDER_VINKEL = 9;
const FLADDER_FART = 2.4;

export interface StromObjekt {
  typNamn: string;
  typ: FangstTyp;
  obj: Phaser.GameObjects.Container;
  /** x utan fladder. */
  bas: number;
  /** Tid sedan objektet släpptes (s) och fladdrets fas. */
  t: number;
  fas: number;
}

export interface Spelplats {
  x: number;
  y: number;
  b: number;
  h: number;
}

export class Fangststrom {
  private aktiva: StromObjekt[] = [];
  /** Omgångens återstående objekt i ordning ("antal"); null för en oändlig ström. */
  private ko: string[] | null;
  private tillNasta: number;
  private sistaX = -Infinity;

  constructor(
    private scene: Phaser.Scene,
    private inst: FangstStrom,
  ) {
    this.ko = inst.antal ? Phaser.Utils.Array.Shuffle(Object.entries(inst.antal).flatMap(([typ, n]) => Array<string>(n).fill(typ))) : null;
    this.tillNasta = inst.fordrojning ?? inst.intervall;
    for (const namn of [...Object.keys(inst.antal ?? {}), ...Object.keys(inst.vikter ?? {})]) {
      if (!inst.typer[namn]) console.warn(`Okänd fångsttyp "${namn}" – lägg till den i strom.typer`);
    }
  }

  /**
   * Släpper nya objekt, flyttar de aktiva och returnerar dem som fångats av spelaren eller passerat förbi
   * i detta steg. forlopp (0–1) = hur långt nivån kommit, för tempoökningen. dt i ms.
   */
  uppdatera(dt: number, forlopp: number, sp: Spelplats): { fangade: StromObjekt[]; passerade: StromObjekt[] } {
    this.tillNasta -= dt;
    if (this.tillNasta <= 0) {
      this.slapp();
      const slut = this.inst.slutIntervall ?? this.inst.intervall;
      this.tillNasta += Phaser.Math.Linear(this.inst.intervall, slut, Phaser.Math.Clamp(forlopp, 0, 1));
    }
    const fangade: StromObjekt[] = [];
    const passerade: StromObjekt[] = [];
    const s = dt / 1000;
    this.aktiva = this.aktiva.filter((o) => {
      o.t += s;
      o.obj.y += this.inst.fart * s;
      if (o.typ.fladder) {
        o.obj.x = o.bas + Math.sin(o.t * FLADDER_FART + o.fas) * FLADDER_X;
        o.obj.angle = Math.sin(o.t * FLADDER_FART + o.fas + 0.7) * FLADDER_VINKEL;
      }
      const { b, h } = o.typ;
      // Lite förlåtande: objektet räknas som fångat när en bra bit av det når spelaren.
      if (Math.abs(o.obj.x - sp.x) < sp.b / 2 + b * 0.3 && Math.abs(o.obj.y - sp.y) < sp.h / 2 + h * 0.3) {
        fangade.push(o);
        this.scene.tweens.add({ targets: o.obj, x: sp.x, y: sp.y, scale: 0.35, alpha: 0, angle: 0, duration: 220, onComplete: () => o.obj.destroy() });
        return false;
      }
      if (o.obj.y - h / 2 > sp.y + sp.h / 2 + 8) {
        passerade.push(o);
        this.scene.tweens.add({ targets: o.obj, alpha: 0, y: o.obj.y + 16, duration: 250, onComplete: () => o.obj.destroy() });
        return false;
      }
      return true;
    });
    return { fangade, passerade };
  }

  /** Antal objekt kvar (inte släppta än eller fortfarande i luften) vars typ uppfyller villkoret. */
  kvar(villkor: (typ: FangstTyp) => boolean): number {
    const ejSlappta = this.ko?.filter((n) => this.inst.typer[n] && villkor(this.inst.typer[n])).length ?? Infinity;
    return ejSlappta + this.aktiva.filter((o) => villkor(o.typ)).length;
  }

  stoppa(): void {
    this.ko = [];
    this.tillNasta = Infinity;
    for (const o of this.aktiva) this.scene.tweens.add({ targets: o.obj, alpha: 0, duration: 200, onComplete: () => o.obj.destroy() });
    this.aktiva = [];
  }

  private nastaTyp(): string | undefined {
    if (this.ko) return this.ko.shift();
    const vikter = Object.entries(this.inst.vikter ?? {});
    const summa = vikter.reduce((a, [, v]) => a + v, 0);
    let r = Math.random() * summa;
    for (const [namn, v] of vikter) {
      r -= v;
      if (r <= 0) return namn;
    }
    return vikter[0]?.[0];
  }

  private slapp(): void {
    const namn = this.nastaTyp();
    const typ = namn ? this.inst.typer[namn] : undefined;
    if (!namn || !typ) return;
    const kant = this.inst.kant ?? { vanster: avstand.l, hoger: BREDD - avstand.l };
    const marginal = typ.b / 2 + (typ.fladder ? FLADDER_X : 0);
    const min = kant.vanster + marginal;
    const max = kant.hoger - marginal;
    // Inte rakt under förra objektet: då ser två objekt ut som ett.
    let x = Phaser.Math.Between(min, max);
    for (let i = 0; i < 6 && Math.abs(x - this.sistaX) < typ.b; i++) x = Phaser.Math.Between(min, max);
    this.sistaX = x;

    const g = this.scene.add.graphics();
    ritaFigur(g, typ.utseende, 0, 0, typ.b, typ.h, typ.farg ? farg[typ.farg] : undefined);
    const obj = this.scene.add.container(x, this.inst.y, [g]).setDepth(12);
    if (typ.etiketter?.length) {
      const etikett = Phaser.Utils.Array.GetRandom(typ.etiketter);
      const textFarg = typ.etikettFarg ?? (typ.farg && arMork(typ.farg) ? 'ljusbeige' : 'morkgron');
      const t = skapaText(this.scene, 0, 5, etikett, 'knapp', textFarg, { origo: [0.5, 0.5], storlek: 12, bredd: typ.b - 10, justering: 'center' });
      obj.add(t);
    }
    obj.setAlpha(0);
    this.scene.tweens.add({ targets: obj, alpha: 1, duration: 200 });
    this.aktiva.push({ typNamn: namn, typ, obj, bas: x, t: 0, fas: Math.random() * Math.PI * 2 });
  }
}
