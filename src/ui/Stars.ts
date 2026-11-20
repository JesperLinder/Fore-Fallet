/** Stjärnbetyg med Fylgias fyruddiga stjärna. Klarar halva stjärnor (kan finnas i äldre sparningar). */
import Phaser from 'phaser';
import { farg, type FargNamn } from '../config/theme';
import { fyllStjarna, konturStjarna } from './shapes';

export interface StjarnVal {
  storlek: number;
  mellanrum: number;
  fyllFarg: FargNamn;
  konturFarg: FargNamn;
  /** Antal platser (normalt 3). */
  platser?: number;
}

/** Skapar en rad stjärnor centrerad i (x, y). Varje stjärna är en egen container så att den kan animeras. */
export function stjarnRad(
  scene: Phaser.Scene,
  x: number,
  y: number,
  antal: number,
  val: StjarnVal,
): Phaser.GameObjects.Container[] {
  const platser = val.platser ?? 3;
  const totalBredd = platser * val.storlek + (platser - 1) * val.mellanrum;
  const stjarnor: Phaser.GameObjects.Container[] = [];
  for (let i = 0; i < platser; i++) {
    const cx = x - totalBredd / 2 + val.storlek / 2 + i * (val.storlek + val.mellanrum);
    const g = scene.add.graphics();
    const andel = Phaser.Math.Clamp(antal - i, 0, 1);
    if (andel < 1) konturStjarna(g, 0, 0, val.storlek, farg[val.konturFarg], val.storlek > 24 ? 1.5 : 1);
    fyllStjarna(g, 0, 0, val.storlek, farg[val.fyllFarg], andel);
    stjarnor.push(scene.add.container(cx, y, [g]));
  }
  return stjarnor;
}
