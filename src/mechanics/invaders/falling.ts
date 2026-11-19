/**
 * Fallande fångstobjekt i invaders (t.ex. bokstäverna O och G i Löpsedeln):
 * guldcirklar som faller långsamt och ska fångas av spelaren.
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import type { FangstData } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';

const STANDARD_RADIE = 20;
const ATERKOMST_MS = 700;

export interface Fangst {
  data: FangstData;
  obj: Phaser.GameObjects.Container;
  r: number;
  vantar: number;
  fangad: boolean;
}

export function skapaFangst(scene: Phaser.Scene, data: FangstData): Fangst {
  const r = data.radie ?? STANDARD_RADIE;
  const g = scene.add.graphics().fillStyle(farg.guld, 1).fillCircle(0, 0, r);
  const t = skapaText(scene, 0, 1, data.etikett, 'rubrik', 'morkgron', { origo: [0.5, 0.5], storlek: r * 1.05 });
  const obj = scene.add.container(data.x, data.y, [g, t]).setDepth(12);
  return { data, obj, r, vantar: data.fordrojning ?? 0, fangad: false };
}

/** Flyttar objektet nedåt. dt i ms. */
export function fallSteg(f: Fangst, dt: number): void {
  if (f.fangad) return;
  if (f.vantar > 0) {
    f.vantar -= dt;
    return;
  }
  f.obj.y += (f.data.fart * dt) / 1000;
}

/** Skickar tillbaka ett missat objekt till start. Returnerar false om det inte ska komma tillbaka. */
export function aterstall(scene: Phaser.Scene, f: Fangst): boolean {
  if (f.data.aterkommer === false) {
    f.obj.setVisible(false);
    return false;
  }
  f.obj.setPosition(f.data.x, f.data.y).setAlpha(0);
  f.vantar = ATERKOMST_MS;
  scene.tweens.add({ targets: f.obj, alpha: 1, duration: ATERKOMST_MS });
  return true;
}
