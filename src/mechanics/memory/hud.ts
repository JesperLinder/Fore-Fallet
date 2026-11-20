/**
 * Memorynivåns HUD under rubriken: kort för "Par 3 / 8", "Drag" och (valfritt) "Tid kvar", i samma stil
 * som invaders-korten (mörkgröna kort med grön kontur), en valfri mätare med nivåspecifikt namn under dem,
 * och den mörkgröna inforutan med nivåns förklaring.
 */
import Phaser from 'phaser';
import { avstand, css, farg, radie } from '../../config/theme';
import { BREDD } from '../../config/display';
import type { MemoryInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';

const Y0 = 92;
const KORT_H = 56;
const MELLAN = 10;
const DJUP = 5;

export interface MemoryHud {
  visaPar: (hittade: number, totalt: number) => void;
  visaDrag: (drag: number) => void;
  visaTid: (sekunder: number) => void;
  visaMatare: (steg: number) => void;
  markeraMatare: () => void;
  /** Underkanten på allt HUD:en ritat (inforutan inräknad). */
  nederkant: number;
}

export function byggMemoryHud(scene: Phaser.Scene, inst: MemoryInstallningar): MemoryHud {
  const x0 = avstand.l;
  const helB = BREDD - x0 * 2;
  const g = scene.add.graphics().setDepth(DJUP);
  const kortRuta = (x: number, y: number, w: number, h: number): void => {
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(x, y, w, h, radie.m);
    g.lineStyle(1, farg.gron, 1).strokeRoundedRect(x, y, w, h, radie.m);
  };
  const antal = inst.tid ? 3 : 2;
  const b = (helB - MELLAN * (antal - 1)) / antal;
  const kort = (i: number, rubrik: string, vardeFarg: 'ljusbeige' | 'guld'): Phaser.GameObjects.Text => {
    const x = x0 + i * (b + MELLAN);
    kortRuta(x, Y0, b, KORT_H);
    skapaText(scene, x + 14, Y0 + 12, rubrik, 'overrubrik', 'beige', { storlek: 11 }).setDepth(DJUP + 1);
    return skapaText(scene, x + 14, Y0 + 27, '', 'rubrik', vardeFarg, { storlek: 20 }).setDepth(DJUP + 1);
  };
  const par = kort(0, inst.hud.par, 'ljusbeige');
  const drag = kort(1, inst.hud.drag, 'ljusbeige');
  const tid = inst.tid ? kort(2, inst.tid.etikett, 'guld') : undefined;
  let y = Y0 + KORT_H;

  // Valfri mätare: ett brett kort med en stapel som fylls ett steg per miss.
  let visaMatare = (_steg: number): void => {};
  let markeraMatare = (): void => {};
  if (inst.matare) {
    const m = inst.matare;
    const my = y + MELLAN;
    const mh = 46;
    kortRuta(x0, my, helB, mh);
    skapaText(scene, x0 + 14, my + 10, m.namn, 'overrubrik', 'beige', { storlek: 11 }).setDepth(DJUP + 1);
    const stapel = scene.add.graphics().setDepth(DJUP + 1);
    let andel = 0;
    const rita = (fyll: number): void => {
      stapel.clear().fillStyle(farg.gron, 1).fillRoundedRect(x0 + 14, my + 28, helB - 28, 8, 4);
      if (andel > 0) stapel.fillStyle(fyll, 1).fillRoundedRect(x0 + 14, my + 28, Math.max(8, (helB - 28) * andel), 8, 4);
    };
    visaMatare = (steg) => {
      andel = Math.min(1, steg / m.steg);
      rita(farg.guld);
    };
    markeraMatare = () => {
      rita(farg.lila);
      scene.time.delayedCall(450, () => rita(farg.guld));
    };
    rita(farg.guld);
    y = my + mh;
  }

  // Inforutan: mörkgrön med ljus text.
  if (inst.infotext) {
    const iy = y + MELLAN;
    const t = skapaText(scene, x0 + 16, iy + 12, inst.infotext, 'brod', 'ljusbeige', { bredd: helB - 32, storlek: 14 }).setDepth(DJUP + 1);
    const h = t.height + 24;
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(x0, iy, helB, h, radie.m);
    y = iy + h;
  }

  return {
    visaPar: (hittade, totalt) => void par.setText(`${hittade} / ${totalt}`),
    visaDrag: (n) => void drag.setText(String(n)),
    visaTid: (sekunder) => {
      if (!tid) return;
      const s = Math.max(0, Math.ceil(sekunder));
      tid.setText(`${pad(Math.floor(s / 60))}:${pad(s % 60)}`);
      tid.setColor(css(s <= 10 ? 'lila' : 'guld'));
    },
    visaMatare,
    markeraMatare,
    nederkant: y,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
