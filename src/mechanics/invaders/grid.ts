/**
 * Brickornas rutnät i invaders: ritar brickorna, flyttar dem stegvis i sidled och nedåt,
 * och svarar på om ett skott träffar en bricka.
 */
import Phaser from 'phaser';
import { farg, radie } from '../../config/theme';
import type { BrickData, InvadersInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { streckadRam } from '../../ui/shapes';

/** Hur mycket rätt-brickornas träffyta krymps på varje sida (punkter). */
const FORLATANDE_KANT = 3;

export interface Bricka {
  data: BrickData;
  obj: Phaser.GameObjects.Container;
  /** Position i rutnätet (vänster överkant, relativt rutnätet). */
  lx: number;
  ly: number;
  levande: boolean;
}

export class Rutnat {
  readonly brickor: Bricka[] = [];
  private behallare: Phaser.GameObjects.Container;
  private riktning: 1 | -1 = 1;
  private tid = 0;

  constructor(private scene: Phaser.Scene, private inst: InvadersInstallningar['brickor']) {
    const forskj = (r: number) => inst.forskjutning?.[r] ?? 0;
    const totalB = Math.max(
      ...inst.rader.map((rad, r) => forskj(r) + rad.length * inst.b + (rad.length - 1) * inst.mellanrum),
    );
    const x0 = (inst.kant.vanster + inst.kant.hoger) / 2 - totalB / 2;
    this.behallare = scene.add.container(x0, inst.startY).setDepth(10);

    inst.rader.forEach((rad, r) =>
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
        const obj = this.ritaBricka(data, lx, ly);
        this.behallare.add(obj);
        this.brickor.push({ data, obj, lx, ly, levande: true });
      }),
    );
  }

  private ritaBricka(data: BrickData, lx: number, ly: number): Phaser.GameObjects.Container {
    const { b, h } = this.inst;
    const fel = data.typ === 'fel';
    const g = this.scene.add.graphics();
    g.fillStyle(fel ? farg.vinrod : farg.beige, 1).fillRoundedRect(-b / 2, -h / 2, b, h, radie.s);
    if (fel) g.lineStyle(1.5, farg.lila, 1).strokeRoundedRect(-b / 2, -h / 2, b, h, radie.s);
    const t = skapaText(this.scene, 0, 1, data.etikett, 'rubrik', fel ? 'ljusbeige' : 'morkgron', {
      origo: [0.5, 0.5],
      storlek: data.etikett.length > 2 ? 15 : 26,
    });
    return this.scene.add.container(lx + b / 2, ly + h / 2, [g, t]);
  }

  /** Flyttar rutnätet ett steg när det är dags. dt i ms. */
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

  /** Levande brickors yttre kanter i världskoordinater. */
  private kanter(): { vanster: number; hoger: number } {
    const levande = this.brickor.filter((b) => b.levande);
    if (levande.length === 0) return { vanster: this.behallare.x, hoger: this.behallare.x };
    const xs = levande.map((b) => this.behallare.x + b.lx);
    return { vanster: Math.min(...xs), hoger: Math.max(...xs) + this.inst.b };
  }

  /** Underkant (y) på den lägsta levande brickan. */
  nedersta(): number {
    const levande = this.brickor.filter((b) => b.levande);
    if (levande.length === 0) return 0;
    return this.behallare.y + Math.max(...levande.map((b) => b.ly)) + this.inst.h;
  }

  /**
   * Brickan som täcker punkten, om någon. Rätt-brickornas träffyta är lite mindre än det som syns,
   * så att ett skott som nästan går fri från en rätt-bricka får gå igenom.
   */
  traff(x: number, y: number): Bricka | undefined {
    return this.brickor.find((b) => {
      if (!b.levande) return false;
      const marg = b.data.typ === 'ratt' ? FORLATANDE_KANT : 0;
      const bx = this.behallare.x + b.lx + marg;
      const by = this.behallare.y + b.ly;
      return x >= bx && x <= bx + this.inst.b - marg * 2 && y >= by && y <= by + this.inst.h;
    });
  }

  felKvar(): number {
    return this.brickor.filter((b) => b.levande && b.data.typ === 'fel').length;
  }

  /** Brickans mittpunkt i världskoordinater. */
  varldsMitt(b: Bricka): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.behallare.x + b.obj.x, this.behallare.y + b.obj.y);
  }

  /** Tar bort en fel-bricka med en kort animation. */
  taBort(b: Bricka): void {
    b.levande = false;
    this.scene.tweens.add({ targets: b.obj, scale: 1.25, alpha: 0, duration: 180, onComplete: () => b.obj.destroy() });
  }

  /**
   * Byter en bortskjuten fel-bricka mot en rätt-bricka med etiketten i "ersattning", på samma plats.
   * Den nya brickan får fel-brickans "plats" i slutraden och räknas som rätt (får inte skjutas).
   */
  ersatt(gammal: Bricka): Bricka | undefined {
    const etikett = gammal.data.ersattning;
    if (!etikett) return undefined;
    const data: BrickData = { etikett, typ: 'ratt', plats: gammal.data.plats };
    const obj = this.ritaBricka(data, gammal.lx, gammal.ly).setScale(0.4).setAlpha(0);
    this.behallare.add(obj);
    this.scene.tweens.add({ targets: obj, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    const ny: Bricka = { data, obj, lx: gammal.lx, ly: gammal.ly, levande: true };
    this.brickor.push(ny);
    return ny;
  }

  /** Lyfter ut en bricka ur rutnätet till scenen (för slutraden). */
  lyftUt(b: Bricka): Phaser.GameObjects.Container {
    const mitt = this.varldsMitt(b);
    this.behallare.remove(b.obj);
    this.scene.add.existing(b.obj);
    return b.obj.setPosition(mitt.x, mitt.y).setDepth(30);
  }

  /** Tonar ut tomma platser (används vid vinst). */
  tonaUtResten(): void {
    this.behallare.each((o: Phaser.GameObjects.GameObject) => {
      if (o instanceof Phaser.GameObjects.Graphics) this.scene.tweens.add({ targets: o, alpha: 0, duration: 200 });
    });
  }
}
