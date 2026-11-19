/**
 * Invaders-nivåns HUD: nedräkningen i sidhuvudet, inforutan under rubriken
 * och mätarraden längst ner (t.ex. "Förtalsrisk" i fyra steg).
 */
import Phaser from 'phaser';
import { avstand, css, farg, radie } from '../../config/theme';
import { BREDD, HOJD } from '../../config/display';
import type { InvadersInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';

export const INFO_Y = 92;
export const INFO_H = 44;
export const MATARRAD_H = 46;
export const MATARRAD_Y = HOJD - avstand.l - MATARRAD_H;

const TID_HOGER = BREDD - avstand.l - 56; // lämnar plats åt pausknappen

export interface InvadersHud {
  /** Skott ovanför den här linjen försvinner (under inforutan). */
  tak: number;
  visaTid: (sekunder: number) => void;
  visaMatare: (steg: number) => void;
  /** Kort markering av mätaren vid ett misstag. */
  markeraMatare: () => void;
  /** Var fångade objekt parkeras (världskoordinater) – index 0, 1, 2 … */
  fangstPlats: (index: number) => Phaser.Math.Vector2;
}

export function byggHud(scene: Phaser.Scene, inst: InvadersInstallningar): InvadersHud {
  const visaTid = inst.tid ? byggTid(scene, inst.tid) : () => {};
  if (inst.info?.length) byggInfo(scene, inst.info);
  const tak = inst.infotext ? byggInfotext(scene, inst.infotext) : INFO_Y + INFO_H;
  const matare = inst.matare.visning === 'procent' ? byggProcent(scene, inst.matare) : byggMatare(scene, inst.matare);
  return {
    tak,
    visaTid,
    ...matare,
    fangstPlats: (i) => new Phaser.Math.Vector2(BREDD - avstand.l - 14 - i * 30, MATARRAD_Y - 22),
  };
}

/** "Pressläggning om 00:60". Upp till en minut visas som 00:SS, längre tider som MM:SS. */
function byggTid(scene: Phaser.Scene, tid: NonNullable<InvadersInstallningar['tid']>) {
  skapaText(scene, TID_HOGER, 40, tid.etikett, 'overrubrik', 'ljusbeige', { origo: [1, 0], storlek: 10 }).setDepth(30);
  const varde = skapaText(scene, TID_HOGER, 52, '', 'titel', 'guld', { origo: [1, 0], storlek: 28 }).setDepth(30);
  const kortTid = tid.sekunder <= 60;
  return (sekunder: number) => {
    const s = Math.max(0, Math.ceil(sekunder));
    const text = kortTid ? `00:${String(s).padStart(2, '0')}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    varde.setText(text);
    varde.setColor(css(s <= 10 ? 'lila' : 'guld'));
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function byggInfo(scene: Phaser.Scene, info: NonNullable<InvadersInstallningar['info']>): void {
  const x0 = avstand.l;
  const b = BREDD - x0 * 2;
  scene.add.graphics().fillStyle(farg.gron, 1).fillRoundedRect(x0, INFO_Y, b, INFO_H, INFO_H / 2).setDepth(5);
  const mitt = INFO_Y + INFO_H / 2;
  info.forEach((rad, i) => {
    const hoger = i === info.length - 1 && info.length > 1;
    const etikett = skapaText(scene, 0, mitt, rad.etikett, 'brod', 'beige', { origo: [0, 0.5], storlek: 14 });
    const varde = rad.serif
      ? skapaText(scene, 0, mitt, rad.varde, 'rubrik', 'ljusbeige', { origo: [0, 0.5], storlek: 19 }).setLetterSpacing(1.5)
      : skapaText(scene, 0, mitt, rad.varde, 'knapp', 'ljusbeige', { origo: [0, 0.5], storlek: 14 });
    const bredd = etikett.width + 4 + varde.width;
    const x = hoger ? x0 + b - 18 - bredd : x0 + 18;
    etikett.setX(x).setDepth(6);
    varde.setX(x + etikett.width + 4).setDepth(6);
  });
}

/** Längre text i en grön ruta under rubriken. Returnerar rutans underkant. */
function byggInfotext(scene: Phaser.Scene, innehall: string): number {
  const x0 = avstand.l;
  const b = BREDD - x0 * 2;
  const t = skapaText(scene, x0 + 18, INFO_Y + 14, innehall, 'brod', 'ljusbeige', { bredd: b - 36, storlek: 14 }).setDepth(6);
  const h = t.height + 28;
  scene.add.graphics().fillStyle(farg.gron, 1).fillRoundedRect(x0, INFO_Y, b, h, radie.m).setDepth(5);
  return INFO_Y + h;
}

/** Mätare som procent kvar uppe till höger, t.ex. "God tro 100 %". Tar klockans plats. */
function byggProcent(scene: Phaser.Scene, m: InvadersInstallningar['matare']) {
  skapaText(scene, TID_HOGER, 40, m.namn, 'overrubrik', 'ljusbeige', { origo: [1, 0], storlek: 10 }).setDepth(30);
  const varde = skapaText(scene, TID_HOGER, 52, '', 'titel', 'guld', { origo: [1, 0], storlek: 28 }).setDepth(30);
  return {
    visaMatare: (steg: number) => {
      const kvar = Math.max(0, Math.round(((m.steg - steg) / m.steg) * 100));
      varde.setText(`${kvar} %`);
    },
    markeraMatare: () => {
      // En enda markering per misstag: lila en kort stund, sedan tillbaka till guld.
      varde.setColor(css('lila'));
      scene.time.delayedCall(450, () => varde.setColor(css('guld')));
    },
  };
}

function byggMatare(scene: Phaser.Scene, m: InvadersInstallningar['matare']) {
  const x0 = avstand.l;
  const b = BREDD - x0 * 2;
  const mitt = MATARRAD_Y + MATARRAD_H / 2;
  scene.add.graphics().fillStyle(farg.gron, 1).fillRoundedRect(x0, MATARRAD_Y, b, MATARRAD_H, MATARRAD_H / 2).setDepth(30);
  const namn = skapaText(scene, x0 + 20, mitt, m.namn, 'brod', 'ljusbeige', { origo: [0, 0.5], storlek: 14 }).setDepth(31);
  const status = m.status
    ? skapaText(scene, x0 + b - 20, mitt, m.status, 'brod', 'beige', { origo: [1, 0.5], storlek: 14 }).setDepth(31)
    : undefined;

  // Stegen centreras i utrymmet mellan namnet och statustexten.
  const fran = namn.x + namn.width + 16;
  const till = (status ? status.x - status.width : x0 + b - 20) - 16;
  const segMellan = 5;
  const segB = Math.min(26, (till - fran - (m.steg - 1) * segMellan) / m.steg);
  const segX = (fran + till) / 2 - (m.steg * (segB + segMellan) - segMellan) / 2;
  const g = scene.add.graphics().setDepth(31);
  const blink = scene.add.graphics().setDepth(32).setAlpha(0);
  blink.fillStyle(farg.lila, 1).fillRoundedRect(segX - 6, mitt - 10, m.steg * (segB + segMellan) - segMellan + 12, 20, 10);

  return {
    visaMatare: (steg: number) => {
      g.clear();
      for (let i = 0; i < m.steg; i++) {
        g.fillStyle(i < steg ? farg.lila : farg.morkgron, 1);
        g.fillRoundedRect(segX + i * (segB + segMellan), mitt - 4, segB, 8, 4);
      }
    },
    markeraMatare: () => {
      blink.setAlpha(0.35);
      scene.tweens.add({ targets: blink, alpha: 0, duration: 450 });
    },
  };
}
