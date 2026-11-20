/** Litet märke i pillerform, t.ex. "FYLGIA-MÅL". Origo i vänsterkant, vertikalt centrerat. */
import Phaser from 'phaser';
import { farg, type FargNamn } from '../config/theme';
import { skapaText } from './text';

export function marke(
  scene: Phaser.Scene,
  x: number,
  y: number,
  innehall: string,
  bakgrund: FargNamn = 'lila',
  textFarg: FargNamn = 'morkgron',
): Phaser.GameObjects.Container {
  const t = skapaText(scene, 8, 0, innehall, 'etikett', textFarg, { origo: [0, 0.5] });
  const b = t.width + 16;
  const h = 18;
  const g = scene.add.graphics().fillStyle(farg[bakgrund], 1).fillRoundedRect(0, -h / 2, b, h, h / 2);
  const c = scene.add.container(x, y, [g, t]);
  c.setSize(b, h);
  return c;
}

/** Pratbubbla i pillerform centrerad i (x, y), t.ex. "Slicezon!" eller "Skadestånd!". */
export function pratbubbla(
  scene: Phaser.Scene,
  x: number,
  y: number,
  innehall: string,
  bakgrund: FargNamn,
  textFarg: FargNamn = 'ljusbeige',
): Phaser.GameObjects.Container {
  const t = skapaText(scene, 0, 0, innehall, 'liten', textFarg, { origo: [0.5, 0.5] });
  t.setFontStyle('600');
  const b = t.width + 20;
  const h = 26;
  const g = scene.add.graphics().fillStyle(farg[bakgrund], 1).fillRoundedRect(-b / 2, -h / 2, b, h, h / 2);
  return scene.add.container(x, y, [g, t]);
}

/**
 * Talbubbla för längre repliker (t.ex. bossen): radbruten text i en rundad ruta med en liten spets nedåt.
 * (x, y) = spetsens ände; bubblan ritas ovanför.
 */
export function talbubbla(
  scene: Phaser.Scene,
  x: number,
  y: number,
  innehall: string,
  bakgrund: FargNamn = 'ljusbeige',
  textFarg: FargNamn = 'morkgron',
  maxBredd = 260,
): Phaser.GameObjects.Container {
  const t = skapaText(scene, 0, 0, innehall, 'brod', textFarg, { origo: [0.5, 1], storlek: 14, bredd: maxBredd - 28, justering: 'center' });
  const b = Math.min(maxBredd, t.width + 28);
  const h = t.height + 20;
  const spets = 10;
  t.setY(-spets - 10);
  const g = scene.add.graphics().fillStyle(farg[bakgrund], 1);
  g.fillRoundedRect(-b / 2, -spets - h, b, h, 14);
  g.fillTriangle(-8, -spets - 1, 8, -spets - 1, 0, 0);
  return scene.add.container(x, y, [g, t]);
}
