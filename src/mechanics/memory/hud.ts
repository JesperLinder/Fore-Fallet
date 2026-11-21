/**
 * Memorynivåns HUD: kort för "Par 3 / 8", "Drag", "Felvändningar" och (valfritt) "Tid kvar", i samma stil
 * som invaders-korten (mörkgröna kort med grön kontur), en valfri mätare med nivåspecifikt namn under dem,
 * och den mörkgröna inforutan med nivåns förklaring.
 *
 * Valfritt: en bevismätare överst (en stapel i procent med tröskellinjer), och korten under rutnätet
 * (hud.placering "under") i stället för över. Utan dessa ser HUD:en ut exakt som förut.
 */
import Phaser from 'phaser';
import { avstand, css, farg, radie } from '../../config/theme';
import { BREDD } from '../../config/display';
import type { BevisInstallningar, MemoryInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { streckadLinje } from '../../ui/shapes';

const Y0 = 92;
const KORT_H = 56;
const MELLAN = 10;
const DJUP = 5;

export interface MemoryHud {
  visaPar: (hittade: number, totalt: number) => void;
  visaDrag: (drag: number) => void;
  visaMissar: (missar: number) => void;
  visaTid: (sekunder: number) => void;
  visaMatare: (steg: number) => void;
  markeraMatare: () => void;
  /** Bevismätaren i procent (0–100), och en kort markering när den stiger eller sjunker. */
  visaBevis: (procent: number) => void;
  markeraBevis: (upp: boolean) => void;
  /** Underkanten på allt HUD:en ritat ovanför rutnätet (inforutan inräknad). */
  nederkant: number;
  /** Höjden på korten när de står under rutnätet (0 annars). */
  hojdUnder: number;
  /** Ritar korten på höjden y (bara med placering "under"; anropas när rutnätet är byggt). */
  placeraKort: (y: number) => void;
}

/** toppY: rubrikens underkant (en lång titel kan ta två rader). mork: mörk bakgrund. */
export function byggMemoryHud(scene: Phaser.Scene, inst: MemoryInstallningar, toppY = 0, mork = false): MemoryHud {
  const x0 = avstand.l;
  const helB = BREDD - x0 * 2;
  const g = scene.add.graphics().setDepth(DJUP);
  const kortRuta = (x: number, y: number, w: number, h: number): void => {
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(x, y, w, h, radie.m);
    g.lineStyle(1, farg.gron, 1).strokeRoundedRect(x, y, w, h, radie.m);
  };
  let y = Math.max(Y0, toppY + 12);

  // Bevismätaren överst (valfri).
  let visaBevis = (_p: number): void => {};
  let markeraBevis = (_upp: boolean): void => {};
  if (inst.bevis) {
    const b = byggBevis(scene, inst.bevis, x0, y, helB, mork);
    ({ visaBevis, markeraBevis } = b);
    y = b.nederkant;
  }

  // HUD-korten: par, drag, felvändningar och tid, i den ordningen (de som anges).
  const rubriker: { rubrik: string; farg: 'ljusbeige' | 'guld' }[] = [{ rubrik: inst.hud.par, farg: 'ljusbeige' }];
  if (inst.hud.drag) rubriker.push({ rubrik: inst.hud.drag, farg: 'ljusbeige' });
  if (inst.hud.missar) rubriker.push({ rubrik: inst.hud.missar, farg: 'ljusbeige' });
  if (inst.tid) rubriker.push({ rubrik: inst.tid.etikett, farg: 'guld' });
  const b = (helB - MELLAN * (rubriker.length - 1)) / rubriker.length;
  const varden: Phaser.GameObjects.Text[] = [];
  const ritaKort = (ky: number): void => {
    rubriker.forEach((r, i) => {
      const x = x0 + i * (b + MELLAN);
      kortRuta(x, ky, b, KORT_H);
      const rubrik = skapaText(scene, x + 14, ky + 12, r.rubrik, 'overrubrik', 'beige', { storlek: 11 }).setDepth(DJUP + 1);
      // En lång rubrik (t.ex. "Felvändningar" i ett av tre kort) krymps så att den ryms.
      if (rubrik.width > b - 20) rubrik.setScale((b - 20) / rubrik.width);
      varden.push(skapaText(scene, x + 14, ky + 27, '', 'rubrik', r.farg, { storlek: 20 }).setDepth(DJUP + 1));
    });
  };
  const under = inst.hud.placering === 'under';
  if (!under) {
    if (inst.bevis) y += MELLAN;
    ritaKort(y);
    y += KORT_H;
  }
  const varde = (i: number): Phaser.GameObjects.Text | undefined => (i < 0 ? undefined : varden[i]);
  const iDrag = inst.hud.drag ? 1 : -1;
  const iMissar = inst.hud.missar ? (inst.hud.drag ? 2 : 1) : -1;
  const iTid = inst.tid ? rubriker.length - 1 : -1;

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
    visaPar: (hittade, totalt) => void varde(0)?.setText(`${hittade} / ${totalt}`),
    visaDrag: (n) => void varde(iDrag)?.setText(String(n)),
    visaMissar: (n) => void varde(iMissar)?.setText(String(n)),
    visaTid: (sekunder) => {
      const tid = varde(iTid);
      if (!tid) return;
      const s = Math.max(0, Math.ceil(sekunder));
      tid.setText(`${pad(Math.floor(s / 60))}:${pad(s % 60)}`);
      tid.setColor(css(s <= 10 ? 'lila' : 'guld'));
    },
    visaMatare,
    markeraMatare,
    visaBevis,
    markeraBevis,
    nederkant: y,
    hojdUnder: under ? KORT_H : 0,
    placeraKort: (ky) => {
      if (under && varden.length === 0) ritaKort(ky);
    },
  };
}

/**
 * Bevismätaren: en panel med namnet över stapeln, tröskellinjerna med etiketter under stapeln och en valfri
 * förklaring sist. Den vinnande tröskeln är en ljus heldragen linje; "streckad" ger en svagare streckad linje.
 */
function byggBevis(scene: Phaser.Scene, bevis: BevisInstallningar, x0: number, y0: number, b: number, mork: boolean) {
  const panel = scene.add.graphics().setDepth(DJUP);
  const sx = x0 + 14;
  const sb = b - 28;
  const stapelY = y0 + 34;
  const SH = 10;
  skapaText(scene, sx, y0 + 14, bevis.namn, 'overrubrik', 'beige', { storlek: 11 }).setDepth(DJUP + 1);

  const stapel = scene.add.graphics().setDepth(DJUP + 1);
  let procent = bevis.start ?? 0;
  const rita = (fyll: number): void => {
    stapel.clear().fillStyle(farg.morkgron, 1).fillRoundedRect(sx, stapelY, sb, SH, SH / 2);
    if (procent > 0) stapel.fillStyle(fyll, 1).fillRoundedRect(sx, stapelY, Math.max(SH, (sb * Math.min(100, procent)) / 100), SH, SH / 2);
  };

  // Tröskellinjerna ovanpå stapeln, etiketterna centrerade under (inom panelen).
  const linjer = scene.add.graphics().setDepth(DJUP + 2);
  let etikettNed = stapelY + SH;
  // Etiketterna centreras under sina linjer. Överlappar två (linjerna ligger nära varandra) ställs den vänstra
  // med högerkanten vid sin linje och den högra med vänsterkanten vid sin.
  const etiketter = bevis.trosklar.map((t, i) => {
    const x = sx + (sb * t.varde) / 100;
    const vinst = i === bevis.vinsttroskel;
    if (t.streckad) {
      linjer.lineStyle(1.5, farg.beige, 0.55);
      streckadLinje(linjer, [new Phaser.Math.Vector2(x, stapelY - 6), new Phaser.Math.Vector2(x, stapelY + SH + 6)], 3, 3);
    } else {
      linjer.lineStyle(vinst ? 2.5 : 1.5, farg.ljusbeige, 1).lineBetween(x, stapelY - 6, x, stapelY + SH + 6);
    }
    const e = skapaText(scene, x, stapelY + SH + 16, t.etikett, 'overrubrik', 'beige', { origo: [0.5, 0.5], storlek: 10 }).setDepth(DJUP + 1);
    if (t.streckad) e.setAlpha(0.65);
    const halv = e.width / 2;
    e.setX(Phaser.Math.Clamp(x, sx + halv, sx + sb - halv));
    return { t, x, e };
  });
  for (let i = 1; i < etiketter.length; i++) {
    const v = etiketter[i - 1];
    const h = etiketter[i];
    if (v.e.x + v.e.width / 2 <= h.e.x - h.e.width / 2) continue;
    v.e.setX(Math.max(sx + v.e.width / 2, v.x - 4 - v.e.width / 2));
    h.e.setX(Math.min(sx + sb - h.e.width / 2, h.x + 4 + h.e.width / 2));
  }
  for (const { t, e } of etiketter) {
    etikettNed = Math.max(etikettNed, e.y + e.height / 2);
    if (t.notis) {
      // Liten rad under etiketten, t.ex. "Räcker inte den här gången."
      const n = skapaText(scene, e.x, e.y + e.height / 2 + 2, t.notis, 'ingress', 'beige', { origo: [0.5, 0], storlek: 12 }).setDepth(DJUP + 1);
      if (t.streckad) n.setAlpha(0.8);
      n.setX(Phaser.Math.Clamp(e.x + e.width / 2 - n.width / 2, sx + n.width / 2, sx + sb - n.width / 2));
      etikettNed = Math.max(etikettNed, n.y + n.height);
    }
  }

  let h = etikettNed - y0 + 10;
  if (bevis.text) {
    const t = skapaText(scene, sx, etikettNed + 8, bevis.text, 'liten', 'ljusbeige', { bredd: sb, storlek: 12 }).setDepth(DJUP + 1);
    h = t.y + t.height - y0 + 12;
  }
  panel.fillStyle(mork ? farg.gron : farg.morkgron, 1).fillRoundedRect(x0, y0, b, h, radie.l);
  rita(farg.guld);

  return {
    nederkant: y0 + h,
    visaBevis: (p: number) => {
      procent = Phaser.Math.Clamp(p, 0, 100);
      rita(farg.guld);
    },
    markeraBevis: (upp: boolean) => {
      // Kort markering: ljus när den stiger, lila när den sjunker.
      rita(upp ? farg.ljusbeige : farg.lila);
      scene.time.delayedCall(320, () => rita(farg.guld));
    },
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
