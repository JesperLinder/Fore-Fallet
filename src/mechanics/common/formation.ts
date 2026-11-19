/**
 * Formation: ett rutnät av objekt som marscherar – flyttar sig stegvis i sidled och ett steg nedåt
 * vid kanten. Delas av invaders (bokstavsbrickor) och hybrid (borgenärer). Hur objekten ser ut
 * bestämmer mekaniken via en ritfunktion; positioner och rörelse kommer från nivåfilen.
 */
import Phaser from 'phaser';
import { farg, radie } from '../../config/theme';
import type { RutnatInstallningar } from '../../core/levelTypes';
import { streckadRam } from '../../ui/shapes';

export interface FormationsObjekt<T> {
  data: T;
  obj: Phaser.GameObjects.Container;
  /** Position i rutnätet (vänster överkant, relativt rutnätet). */
  lx: number;
  ly: number;
  levande: boolean;
}

/** Ritar ett objekt centrerat i (0, 0). Formationen placerar det. */
export type RitaObjekt<T> = (scene: Phaser.Scene, data: T, b: number, h: number) => Phaser.GameObjects.Container;

export class Formation<T> {
  readonly objekt: FormationsObjekt<T>[] = [];
  protected behallare: Phaser.GameObjects.Container;
  private riktning: 1 | -1 = 1;
  private tid = 0;

  constructor(
    protected scene: Phaser.Scene,
    protected inst: RutnatInstallningar<T>,
    private rita: RitaObjekt<T>,
    djup = 10,
  ) {
    const forskj = (r: number) => inst.forskjutning?.[r] ?? 0;
    const totalB = Math.max(
      ...inst.rader.map((rad, r) => forskj(r) + rad.length * inst.b + (rad.length - 1) * inst.mellanrum),
    );
    const x0 = (inst.kant.vanster + inst.kant.hoger) / 2 - totalB / 2;
    const rader = inst.blanda ? blandade(inst.rader) : inst.rader;
    this.behallare = scene.add.container(x0, inst.startY).setDepth(djup);

    rader.forEach((rad, r) =>
      rad.forEach((data, k) => {
        const lx = forskj(r) + k * (inst.b + inst.mellanrum);
        const ly = r * (inst.h + inst.mellanrum);
        if (!data) {
          if (inst.visaTomma) {
            const g = scene.add.graphics();
            streckadRam(g, lx, ly, inst.b, inst.h, radie.s, farg.beige);
            this.behallare.add(g.setAlpha(0.6));
          }
          return;
        }
        this.lagg(data, lx, ly);
      }),
    );
  }

  /** Ritar och lägger till ett objekt på en plats i rutnätet. */
  protected lagg(data: T, lx: number, ly: number): FormationsObjekt<T> {
    const obj = this.rita(this.scene, data, this.inst.b, this.inst.h).setPosition(lx + this.inst.b / 2, ly + this.inst.h / 2);
    this.behallare.add(obj);
    const o: FormationsObjekt<T> = { data, obj, lx, ly, levande: true };
    this.objekt.push(o);
    return o;
  }

  /** Ritar om ett objekt på samma plats, t.ex. när dess data ändrats. */
  ritaOm(o: FormationsObjekt<T>): void {
    const ny = this.rita(this.scene, o.data, this.inst.b, this.inst.h);
    o.obj.removeAll(true);
    for (const barn of [...ny.list]) {
      ny.remove(barn);
      o.obj.add(barn);
    }
    ny.destroy();
  }

  /** Flyttar formationen ett steg när det är dags. dt i ms. */
  uppdatera(dt: number): void {
    this.tid += dt;
    if (this.tid < this.inst.steg.intervall) return;
    this.tid -= this.inst.steg.intervall;
    const { vanster, hoger } = this.kanter();
    const dx = this.inst.steg.x * this.riktning;
    if (vanster + dx < this.inst.kant.vanster || hoger + dx > this.inst.kant.hoger) {
      this.behallare.y += this.inst.steg.ned;
      this.riktning = this.riktning === 1 ? -1 : 1;
    } else {
      this.behallare.x += dx;
    }
  }

  /** Yttre kanter i världskoordinater: levande objekt, eller alla med fastBredd. */
  private kanter(): { vanster: number; hoger: number } {
    const levande = this.objekt.filter((b) => b.levande || this.inst.fastBredd);
    if (levande.length === 0) return { vanster: this.behallare.x, hoger: this.behallare.x };
    const xs = levande.map((b) => this.behallare.x + b.lx);
    return { vanster: Math.min(...xs), hoger: Math.max(...xs) + this.inst.b };
  }

  /** Underkant (y) på det lägsta levande objektet. */
  nedersta(): number {
    const levande = this.objekt.filter((b) => b.levande);
    if (levande.length === 0) return 0;
    return this.behallare.y + Math.max(...levande.map((b) => b.ly)) + this.inst.h;
  }

  /** Objektet som täcker punkten, om något. marg krymper träffytan i sidled per objekt. */
  traff(x: number, y: number, marg: (data: T) => number = () => 0): FormationsObjekt<T> | undefined {
    return this.objekt.find((b) => {
      if (!b.levande) return false;
      const m = marg(b.data);
      const bx = this.behallare.x + b.lx + m;
      const by = this.behallare.y + b.ly;
      return x >= bx && x <= bx + this.inst.b - m * 2 && y >= by && y <= by + this.inst.h;
    });
  }

  /** Objektets mittpunkt i världskoordinater. */
  varldsMitt(b: FormationsObjekt<T>): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.behallare.x + b.obj.x, this.behallare.y + b.obj.y);
  }

  /** Tar bort ett objekt med en kort animation. */
  taBort(b: FormationsObjekt<T>): void {
    b.levande = false;
    this.scene.tweens.add({ targets: b.obj, scale: 1.25, alpha: 0, duration: 180, onComplete: () => b.obj.destroy() });
  }

  /** Lyfter ut ett objekt ur rutnätet till scenen (t.ex. för en slutrad). */
  lyftUt(b: FormationsObjekt<T>): Phaser.GameObjects.Container {
    const mitt = this.varldsMitt(b);
    this.behallare.remove(b.obj);
    this.scene.add.existing(b.obj);
    return b.obj.setPosition(mitt.x, mitt.y).setDepth(30);
  }

  /** Tonar ut tomma platser. */
  tonaUtResten(): void {
    this.behallare.each((o: Phaser.GameObjects.GameObject) => {
      if (o instanceof Phaser.GameObjects.Graphics) this.scene.tweens.add({ targets: o, alpha: 0, duration: 200 });
    });
  }
}

/** Blandar objekten mellan de platser som inte är tomma. Nivåfilens data ändras inte. */
function blandade<T>(rader: (T | null)[][]): (T | null)[][] {
  const objekt = Phaser.Utils.Array.Shuffle(rader.flat().filter((d): d is T => d !== null));
  let i = 0;
  return rader.map((rad) => rad.map((d) => (d === null ? null : objekt[i++])));
}
