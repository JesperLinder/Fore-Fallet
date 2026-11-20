/**
 * Dekorhändelser i invaders: figurer i bakgrunden (t.ex. kor i hagen) som påverkas av återkommande
 * händelser (t.ex. lyfts upp av ett ufo). Utan "raddning" är det rent visuellt; med "raddning" kan
 * spelaren skjuta källan under händelsen så att figuren faller tillbaka (traff).
 * Allt styrs av "dekor" i nivåfilen; en räknare kan visa hur många som är kvar.
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import type { DekorInstallningar } from '../../core/levelTypes';
import { spela } from '../../core/sound';
import { ritaFigur } from '../art';

const VAXLA_MS = 130;
/** Källans träffyta vid räddning (halva bredden/höjden kring källans mitt, t.ex. ett ufo). */
const KALLA_HALV_B = 38;
const KALLA_HALV_H = 22;

interface Figur {
  g: Phaser.GameObjects.Graphics;
  utseende: string;
  kvar: boolean;
}

interface PagaendeLyft {
  figur: Figur;
  tid: number;
  startY: number;
  vaxlat: boolean;
  vaxlaTid: number;
  /** Källan figuren lyfts mot just nu (uppdateras varje steg). */
  kalla?: Phaser.Math.Vector2;
}

export class Dekorhandelser {
  private figurer: Figur[];
  private kagla: Phaser.GameObjects.Graphics;
  private tillNasta: number;
  private lyft: PagaendeLyft | null = null;

  /** kallor: positioner som händelsen utgår från, t.ex. ufonas. visaRaknare anropas när antalet ändras. */
  constructor(
    private scene: Phaser.Scene,
    private inst: DekorInstallningar,
    private kallor: () => Phaser.Math.Vector2[],
    private visaRaknare: (kvar: number, totalt: number) => void,
  ) {
    this.kagla = scene.add.graphics().setDepth(4);
    this.figurer = inst.figurer.map((f) => {
      const g = scene.add.graphics({ x: f.x, y: f.y }).setDepth(5);
      ritaFigur(g, f.utseende, 0, 0);
      return { g, utseende: f.utseende, kvar: true };
    });
    this.tillNasta = inst.handelse.start ?? inst.handelse.intervall;
    this.visaRaknare(this.antalKvar(), this.figurer.length);
  }

  uppdatera(dt: number): void {
    this.tillNasta -= dt;
    if (this.tillNasta <= 0 && !this.lyft) {
      this.tillNasta += this.inst.handelse.intervall;
      this.borja();
    }
    if (this.lyft) this.flytta(this.lyft, dt);
  }

  /** Antal figurer som försvunnit (eller är på väg bort). */
  forlorade(): number {
    return this.figurer.length - this.antalKvar();
  }

  /**
   * Räddning: träffar ett skott i (x, y) källan medan en händelse pågår avbryts den och figuren faller
   * tillbaka. Returnerar figurens position om skottet räddade den, annars undefined.
   */
  traff(x: number, y: number): Phaser.Math.Vector2 | undefined {
    const l = this.lyft;
    if (!this.inst.handelse.raddning || !l?.kalla) return undefined;
    if (Math.abs(x - l.kalla.x) > KALLA_HALV_B || Math.abs(y - l.kalla.y) > KALLA_HALV_H) return undefined;
    this.lyft = null;
    this.kagla.clear();
    const f = l.figur;
    f.kvar = true;
    f.g.clear();
    ritaFigur(f.g, f.utseende, 0, 0);
    this.scene.tweens.add({ targets: f.g, y: l.startY, scale: 1, alpha: 1, duration: 450, ease: 'Bounce.easeOut' });
    this.visaRaknare(this.antalKvar(), this.figurer.length);
    return new Phaser.Math.Vector2(f.g.x, f.g.y);
  }

  private antalKvar(): number {
    return this.figurer.filter((f) => f.kvar).length;
  }

  private borja(): void {
    const kandidater = this.figurer.filter((f) => f.kvar);
    if (kandidater.length === 0) return; // hagen är tom – nivån fortsätter ändå
    const figur = Phaser.Utils.Array.GetRandom(kandidater);
    figur.kvar = false;
    this.lyft = { figur, tid: 0, startY: figur.g.y, vaxlat: false, vaxlaTid: 0 };
    if (this.inst.handelse.ljud) spela(this.inst.handelse.ljud);
  }

  /** Lyfter figuren mot närmaste källa i en ljuskägla; växlar bild så att den sprattlar. */
  private flytta(l: PagaendeLyft, dt: number): void {
    const h = this.inst.handelse;
    l.tid += dt;
    const t = Math.min(1, l.tid / h.langd);
    const g = l.figur.g;
    const kalla = this.narmaste(g.x) ?? new Phaser.Math.Vector2(g.x, l.startY - 200);
    l.kalla = kalla;
    // Glider mot källan i sidled och stiger långsamt (snabbare mot slutet).
    g.x = Phaser.Math.Linear(g.x, kalla.x, Math.min(1, dt / 400));
    g.y = Phaser.Math.Linear(l.startY, kalla.y + 14, t * t);
    g.setScale(1 - 0.5 * t).setAlpha(t > 0.85 ? (1 - t) / 0.15 : 1);

    if (h.vaxla) {
      l.vaxlaTid += dt;
      if (l.vaxlaTid >= VAXLA_MS) {
        l.vaxlaTid = 0;
        l.vaxlat = !l.vaxlat;
        g.clear();
        ritaFigur(g, l.vaxlat ? h.vaxla : l.figur.utseende, 0, 0);
      }
    }

    this.kagla.clear();
    if (t < 1) {
      const botten = l.startY + 16;
      this.kagla.fillStyle(farg.beige, 0.16);
      this.kagla.fillPoints(
        [
          new Phaser.Math.Vector2(kalla.x - 14, kalla.y + 8),
          new Phaser.Math.Vector2(kalla.x + 14, kalla.y + 8),
          new Phaser.Math.Vector2(g.x + 30, botten),
          new Phaser.Math.Vector2(g.x - 30, botten),
        ],
        true,
      );
    } else {
      g.setVisible(false);
      this.lyft = null;
      this.visaRaknare(this.antalKvar(), this.figurer.length);
    }
  }

  private narmaste(x: number): Phaser.Math.Vector2 | undefined {
    const kallor = this.kallor();
    return kallor.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  }
}
