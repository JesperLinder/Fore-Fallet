/**
 * Hinder i hybridnivåer: skyltar (t.ex. "Kvarstad") som pendlar i sidled mellan utslaget och målet.
 * Det som kastas och träffar en skylt stannar där den är (se Hybrid.vidSteg). Allt från "hinder" i nivåfilen.
 */
import Phaser from 'phaser';
import { farg, radie } from '../../config/theme';
import type { HybridHinder } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';

/** Ritas under projektilen men över banan. */
const DJUP = 4.5;
/** Stolpens längd under skylten. */
const STOLPE = 14;

interface Skylt {
  data: HybridHinder;
  obj: Phaser.GameObjects.Container;
  riktning: number;
}

export class Hinder {
  private skyltar: Skylt[];

  constructor(scene: Phaser.Scene, hinder: HybridHinder[]) {
    this.skyltar = hinder.map((d) => {
      const g = scene.add.graphics();
      g.fillStyle(farg.morkgron, 1).fillRect(-1.5, d.h / 2, 3, STOLPE);
      g.fillStyle(farg.vinrod, 1).fillRoundedRect(-d.b / 2, -d.h / 2, d.b, d.h, radie.s);
      const t = skapaText(scene, 0, 0, d.etikett, 'overrubrik', 'ljusbeige', { origo: [0.5, 0.5], storlek: 11 });
      if (t.width > d.b - 10) t.setScale((d.b - 10) / t.width);
      const obj = scene.add.container(d.x, d.y, [g, t]).setDepth(DJUP);
      return { data: d, obj, riktning: d.tillX !== undefined && d.tillX < d.x ? -1 : 1 };
    });
  }

  /** Flyttar skyltarna fram och tillbaka mellan x och tillX. */
  uppdatera(dt: number): void {
    for (const s of this.skyltar) {
      const { x, tillX, fart } = s.data;
      if (tillX === undefined || !fart) continue;
      const min = Math.min(x, tillX);
      const max = Math.max(x, tillX);
      let nx = s.obj.x + (s.riktning * fart * dt) / 1000;
      if (nx >= max || nx <= min) {
        nx = Phaser.Math.Clamp(nx, min, max);
        s.riktning *= -1;
      }
      s.obj.x = nx;
    }
  }

  /** Skylten som punkten (x, y) träffar, om någon. */
  traff(x: number, y: number): HybridHinder | undefined {
    return this.skyltar.find((s) => Math.abs(x - s.obj.x) <= s.data.b / 2 && Math.abs(y - s.obj.y) <= s.data.h / 2)?.data;
  }
}
