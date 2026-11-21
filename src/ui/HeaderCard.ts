/**
 * Mätarkortet uppe till höger bredvid pausknappen, samma i alla nivåer: mörkgrönt kort med grön kontur,
 * liten rubrik i versaler och ett värde under. Mörkgrönt gör att guld, lila och ljusbeige text
 * har minst 4.5:1 i kontrast både på ljusa och mörka banor.
 */
import Phaser from 'phaser';
import { avstand, css, farg, radie, type FargNamn } from '../config/theme';
import { BREDD } from '../config/display';
import { skapaText } from './text';

/** Kortets högerkant: lämnar plats åt pausknappen. */
export const HORNKORT_HOGER = BREDD - avstand.l - 56;
export const HORNKORT_Y = 20;
/** Under nivåetiketten (som slutar vid y≈34); kortet slutar då före inforutan (y 92). */
const HORNKORT_Y_NERE = 40;
const H = 54;
/** Nyckel i scene.data: nivåetikettens högerkant (sätts av LevelScene innan mekaniken byggs). */
export const ETIKETT_HOGER = 'etikettHoger';
/** Nyckel i scenens data: titelns underkant (en lång titel kan ta två rader). Sätts av LevelScene. */
export const RUBRIK_NEDERKANT = 'rubrikNederkant';
const H_KOMPAKT = 46;

export interface Hornkort {
  satt(varde: string): void;
  farg(f: FargNamn): void;
  /** Kort puls, t.ex. vid ett misstag. */
  puls(): void;
  varde: Phaser.GameObjects.Text;
}

/** kompakt: lägre kort med mindre värde (för längre texter, t.ex. "Alla justitieråd"). */
export function hornkort(scene: Phaser.Scene, rubrik: string, vardeFarg: FargNamn = 'ljusbeige', kompakt = false): Hornkort {
  const r = skapaText(scene, 0, 0, rubrik, 'overrubrik', 'beige', { origo: [0.5, 0], storlek: kompakt ? 9 : 10 });
  // Ett brett kort som skulle täcka nivåetiketten flyttas ner under den och blir kompakt.
  const etikettHoger = (scene.data.get(ETIKETT_HOGER) as number | undefined) ?? 0;
  const nere = HORNKORT_HOGER - r.width - 28 < etikettHoger + 8;
  if (nere) kompakt = true;
  const y0 = nere ? HORNKORT_Y_NERE : HORNKORT_Y;
  const h = kompakt ? H_KOMPAKT : H;
  r.setY(y0 + 8);
  const v = skapaText(scene, 0, y0 + 22, '', 'rubrik', vardeFarg, { origo: [0.5, 0], storlek: kompakt ? 14 : 20 });
  const g = scene.add.graphics();
  scene.add.container(0, 0, [g, r, v]).setDepth(30);
  const rita = (): void => {
    const b = Math.max(r.width, v.width) + (kompakt ? 20 : 28);
    const x = HORNKORT_HOGER - b;
    g.clear().fillStyle(farg.morkgron, 1).fillRoundedRect(x, y0, b, h, radie.m);
    g.lineStyle(1, farg.gron, 1).strokeRoundedRect(x, y0, b, h, radie.m);
    r.setX(x + b / 2);
    v.setX(x + b / 2);
  };
  rita();
  return {
    varde: v,
    satt: (t) => {
      if (v.text === t) return;
      v.setText(t);
      rita();
    },
    farg: (f) => void v.setColor(css(f)),
    puls: () => pulsera(scene, v),
  };
}

function pulsera(scene: Phaser.Scene, v: Phaser.GameObjects.Text): void {
  scene.tweens.killTweensOf(v);
  v.setScale(1);
  scene.tweens.add({ targets: v, scale: 1.25, duration: 120, yoyo: true });
}
