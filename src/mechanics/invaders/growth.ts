/**
 * Växande mål och timing-klipp i invaders (t.ex. häckens stammar i Oxelhäcken). Målen står i vila under
 * klipplinjen; med jämna mellanrum börjar ett slumpvis valt mål växa uppåt. Spelaren klipper med verktyget
 * (spelaren) vid klipplinjen: toppen ovanför linjen = rätt klipp, under linjen = för tidigt. Ett mål som når
 * maxhöjd är missat och klipps tillbaka av sig självt. Invaders.ts tillämpar zonens regler.
 * Allt styrs av "vaxande" i nivåfilen.
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import type { VaxandeInstallningar, VaxandeZon } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { streckadLinje } from '../../ui/shapes';

/** Ett för kort mål växer tillbaka till viloHojd med den här farten (punkter per sekund). */
const ATERVAXT = 14;
/** Djup: bakom spelaren (20) och fångstobjekten (12), framför kulisserna. */
const DJUP = 8;

export type Bedomning = 'klipp' | 'for-tidigt';

export interface VaxandeMal {
  x: number;
  zonNamn: string;
  zon: VaxandeZon;
  /** Höjd över baslinjen. */
  h: number;
  vaxer: boolean;
  g: Phaser.GameObjects.Graphics;
}

export class VaxandeMalen {
  readonly mal: VaxandeMal[];
  private tillNasta: number;

  constructor(
    private scene: Phaser.Scene,
    private inst: VaxandeInstallningar,
  ) {
    this.mal = inst.mal.map((m) => {
      const zon = inst.zoner[m.zon];
      if (!zon) console.warn(`Okänd zon "${m.zon}" – lägg till den i vaxande.zoner`);
      return { x: m.x, zonNamn: m.zon, zon: zon ?? { farg: 'gron' }, h: inst.viloHojd, vaxer: false, g: scene.add.graphics().setDepth(DJUP) };
    });
    this.tillNasta = inst.fordrojning ?? inst.intervall;
    this.ritaKlipplinje();
    this.mal.forEach((m) => this.rita(m));
  }

  /** Låter mål växa. Returnerar de mål som nått maxhöjd (missade) i detta steg; de är redan tillbaka i vila. */
  uppdatera(dt: number, forlopp: number): VaxandeMal[] {
    const f = Phaser.Math.Clamp(forlopp, 0, 1);
    this.tillNasta -= dt;
    if (this.tillNasta <= 0) {
      this.tillNasta += Phaser.Math.Linear(this.inst.intervall, this.inst.slutIntervall ?? this.inst.intervall, f);
      const vilande = this.mal.filter((m) => !m.vaxer);
      if (vilande.length) Phaser.Utils.Array.GetRandom(vilande).vaxer = true;
    }
    const fart = Phaser.Math.Linear(this.inst.fart, this.inst.slutFart ?? this.inst.fart, f);
    const missade: VaxandeMal[] = [];
    for (const m of this.mal) {
      if (m.vaxer) m.h += (fart * dt) / 1000;
      else if (m.h < this.inst.viloHojd) m.h = Math.min(this.inst.viloHojd, m.h + (ATERVAXT * dt) / 1000);
      if (m.h >= this.inst.maxHojd) {
        missade.push(m);
        m.vaxer = false;
        m.h = this.inst.viloHojd;
        this.tona(m);
      }
      this.rita(m);
    }
    return missade;
  }

  /** Klipper målet närmast x (inom räckvidd). Returnerar målet och bedömningen, eller undefined om inget nåddes. */
  klipp(x: number): { mal: VaxandeMal; bedomning: Bedomning } | undefined {
    const rackvidd = this.inst.rackvidd ?? this.inst.b / 2 + 6;
    const mal = this.mal.filter((m) => Math.abs(m.x - x) <= rackvidd).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
    if (!mal) return undefined;
    const topp = this.inst.baslinje - mal.h;
    const ratt = topp < this.inst.klipplinje.y;
    this.lov(mal, Math.min(mal.h, this.inst.baslinje - this.inst.klipplinje.y));
    mal.vaxer = false;
    mal.h = ratt ? this.inst.viloHojd : Math.min(mal.h, this.inst.kortHojd);
    if (!ratt) this.blinka(mal);
    this.rita(mal);
    return { mal, bedomning: ratt ? 'klipp' : 'for-tidigt' };
  }

  /** Toppen (y) på målet, för pratbubblor. */
  topp(m: VaxandeMal): number {
    return this.inst.baslinje - m.h;
  }

  /** Ett mål ritas som en buskig pelare: överlappande cirklar (löv) från baslinjen upp till toppen. */
  private rita(m: VaxandeMal): void {
    const { b, baslinje } = this.inst;
    const g = m.g.clear();
    const r = b / 2 + 3;
    const topp = baslinje - m.h + r;
    const steg = r * 0.9;
    const punkter: [number, number][] = [];
    for (let y = baslinje - r * 0.6; y > topp; y -= steg) punkter.push([m.x + ((Math.round(y / steg) % 2) * 2 - 1) * 1.5, y]);
    punkter.push([m.x, topp]);
    if (m.zon.kontur) {
      g.fillStyle(farg[m.zon.kontur], 1);
      for (const [x, y] of punkter) g.fillCircle(x, y, r + 1.5);
    }
    g.fillStyle(farg[m.zon.farg], 1);
    for (const [x, y] of punkter) g.fillCircle(x, y, r);
  }

  /** Klippt löv och kvistar som faller från klipphöjden. */
  private lov(m: VaxandeMal, hojd: number): void {
    const y = this.inst.baslinje - hojd;
    for (let i = 0; i < 6; i++) {
      const g = this.scene.add.graphics({ x: m.x + Phaser.Math.Between(-8, 8), y }).setDepth(DJUP + 1);
      g.fillStyle(farg[m.zon.farg], 1).fillEllipse(0, 0, 8, 5);
      this.scene.tweens.add({
        targets: g,
        x: g.x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(30, 70),
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: Phaser.Math.Between(500, 800),
        onComplete: () => g.destroy(),
      });
    }
  }

  /** Ett för tidigt klipp: målet blinkar till. */
  private blinka(m: VaxandeMal): void {
    this.scene.tweens.add({ targets: m.g, alpha: 0.3, duration: 90, yoyo: true, repeat: 1 });
  }

  /** Ett missat mål som klipps tillbaka av sig självt tonas in igen. */
  private tona(m: VaxandeMal): void {
    m.g.setAlpha(0.2);
    this.scene.tweens.add({ targets: m.g, alpha: 1, duration: 450 });
  }

  private ritaKlipplinje(): void {
    const k = this.inst.klipplinje;
    const xs = this.mal.map((m) => m.x);
    const fran = Math.min(...xs) - this.inst.b - 14;
    const till = Math.max(...xs) + this.inst.b + 14;
    const g = this.scene.add.graphics().setDepth(DJUP + 2);
    g.lineStyle(2, farg.guld, 1);
    streckadLinje(g, [new Phaser.Math.Vector2(fran, k.y), new Phaser.Math.Vector2(till, k.y)], 8, 6);
    if (k.text) {
      // Texten står på en ljus lapp ovanför linjen, så att den syns även när målen växt upp bakom den.
      const t = skapaText(this.scene, (k.textX ?? fran) + 8, k.y - 16, k.text, 'knapp', 'morkockra', { origo: [0, 0.5], storlek: 11 }).setDepth(DJUP + 3);
      this.scene.add.graphics().setDepth(DJUP + 2).fillStyle(farg.ljusbeige, 0.92).fillRoundedRect(t.x - 8, t.y - 10, t.width + 16, 20, 10);
    }
  }
}
