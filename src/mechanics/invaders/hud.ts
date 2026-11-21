/**
 * Invaders-nivåns HUD: nedräkningen i sidhuvudet, inforutan under rubriken
 * och mätaren (t.ex. "Förtalsrisk" i fyra steg längst ner, eller räknaren INTRÅNG uppe till höger).
 * tema: "ljus" ger mörk text och ljusbeige inforuta på ljus bakgrund.
 */
import Phaser from 'phaser';
import { avstand, css, farg, radie } from '../../config/theme';
import { BREDD, HOJD } from '../../config/display';
import type { InvadersInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { hornkort } from '../../ui/HeaderCard';

export const INFO_Y = 92;
export const INFO_H = 44;
export const MATARRAD_H = 46;
export const MATARRAD_Y = HOJD - avstand.l - MATARRAD_H;


export interface InvadersHud {
  /** Skott ovanför den här linjen försvinner (under inforutan). */
  tak: number;
  visaTid: (sekunder: number) => void;
  visaMatare: (steg: number) => void;
  /** Kort markering av mätaren vid ett misstag. */
  markeraMatare: () => void;
  /** Räknaren i kortet bredvid mätaren (visning "kort" + dekor.raknare). */
  visaRaknare: (kvar: number, totalt: number) => void;
  /** Räknarkortet med färdig text (summa, t.ex. "2 000 kr"). */
  visaSumma: (text: string) => void;
  /** Var fångade objekt parkeras (världskoordinater) – index 0, 1, 2 … */
  fangstPlats: (index: number) => Phaser.Math.Vector2;
}

type Matare = NonNullable<InvadersInstallningar['matare']>;

export function byggHud(scene: Phaser.Scene, inst: InvadersInstallningar & { matare: Matare }, tema: 'ljus' | 'mork' = 'mork'): InvadersHud {
  const synligTid = inst.tid && !inst.tid.dold ? inst.tid : undefined;
  // Utan mätare men med summa: räknarkortet (och klockan) som kort under rubriken, utan mätarkort.
  const utanMatare = inst.matare.visning === 'ingen';
  const kortLayout = inst.matare.visning === 'kort' || (utanMatare && !!inst.summa);
  // Med korten (visning "kort") står klockan i ett eget kort, annars uppe till höger.
  let visaTid: InvadersHud['visaTid'] = synligTid && !kortLayout ? byggTid(scene, synligTid) : () => {};
  if (inst.info?.length) byggInfo(scene, inst.info);
  let tak = inst.infotext ? byggInfotext(scene, inst.infotext, tema) : INFO_Y + INFO_H;
  let visaRaknare: InvadersHud['visaRaknare'] = () => {};
  let visaSumma: InvadersHud['visaSumma'] = () => {};
  let matare;
  if (kortLayout) {
    const raknare = inst.dekor?.raknare ?? (inst.summa ? { namn: inst.summa.namn, text: inst.summa.text } : undefined);
    const kort = byggKort(scene, inst.matare, raknare, synligTid, utanMatare);
    matare = kort;
    visaRaknare = kort.visaRaknare;
    visaSumma = kort.visaSumma;
    visaTid = kort.visaTid;
    tak = kort.tak;
  } else {
    const v = inst.matare.visning;
    const ingen = { visaMatare: (_s: number) => {}, markeraMatare: () => {} };
    matare = v === 'ingen' ? ingen : v === 'procent' ? byggProcent(scene, inst.matare) : v === 'antal' ? byggAntal(scene, inst.matare) : byggMatare(scene, inst.matare);
  }
  return {
    tak,
    visaRaknare,
    visaSumma,
    visaTid,
    visaMatare: matare.visaMatare,
    markeraMatare: matare.markeraMatare,
    fangstPlats: (i) => new Phaser.Math.Vector2(BREDD - avstand.l - 14 - i * 30, MATARRAD_Y - 22),
  };
}

/** "Pressläggning om 00:60". Upp till en minut visas som 00:SS, längre tider som MM:SS. */
function byggTid(scene: Phaser.Scene, tid: NonNullable<InvadersInstallningar['tid']>) {
  const kort = hornkort(scene, tid.etikett, 'guld');
  return (sekunder: number) => {
    const s = Math.max(0, Math.ceil(sekunder));
    kort.satt(klocka(s));
    kort.farg(s <= 10 ? 'lila' : 'guld');
  };
}

/** 00:SS (eller MM:SS över en minut). */
function klocka(s: number): string {
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** Klockan i korten; lila de sista tio sekunderna. */
function visaKlocka(varde: Phaser.GameObjects.Text, sekunder: number): void {
  const s = Math.max(0, Math.ceil(sekunder));
  varde.setText(klocka(s));
  varde.setColor(css(s <= 10 ? 'lila' : 'guld'));
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
/** Ruta under rubriken med en längre text. Returnerar rutans underkant (y). Används även av slangbellan. */
export function byggInfotext(scene: Phaser.Scene, innehall: string, tema: 'ljus' | 'mork'): number {
  const x0 = avstand.l;
  const b = BREDD - x0 * 2;
  const ljus = tema === 'ljus';
  const t = skapaText(scene, x0 + 18, INFO_Y + 14, innehall, 'brod', ljus ? 'morkgron' : 'ljusbeige', { bredd: b - 36, storlek: 14 }).setDepth(6);
  const h = t.height + 28;
  scene.add.graphics().fillStyle(ljus ? farg.ljusbeige : farg.gron, 1).fillRoundedRect(x0, INFO_Y, b, h, radie.m).setDepth(5);
  return INFO_Y + h;
}

/**
 * Mätaren som ett kort under rubriken med en guldstapel som börjar full och krymper (eller, med lage "fyll",
 * börjar tom och fylls), och valfritt ett kort bredvid med en räknare (t.ex. "Kor i hagen: 8 av 8").
 */
function byggKort(
  scene: Phaser.Scene,
  m: Matare,
  raknare?: { namn: string; text: string },
  tid?: NonNullable<InvadersInstallningar['tid']>,
  utanMatare = false,
) {
  const x0 = avstand.l;
  const mellan = 10;
  const h = 56;
  const helB = BREDD - x0 * 2;
  // Bredder: klockkortet är smalast, räknaren mellanstor, mätaren tar resten.
  const tidB = tid ? 92 : 0;
  // Utan mätare tar räknaren mätarens plats (allt utom klockan).
  const rakB = raknare ? (utanMatare ? helB - (tidB ? tidB + mellan : 0) : tid ? 106 : (helB - mellan) / 2) : 0;
  const b = utanMatare ? 0 : helB - (tidB ? tidB + mellan : 0) - (rakB ? rakB + mellan : 0);
  const g = scene.add.graphics().setDepth(5);
  // Samma kortstil som mätarkortet i hörnet (ui/HeaderCard.ts): guld och lila text klarar kontrastkravet där.
  const kortRuta = (x: number, w: number): void => {
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(x, INFO_Y, w, h, radie.m);
    g.lineStyle(1, farg.gron, 1).strokeRoundedRect(x, INFO_Y, w, h, radie.m);
  };
  if (b > 0) kortRuta(x0, b);
  const namn = skapaText(scene, x0 + 14, INFO_Y + 12, b > 0 ? m.namn : '', 'overrubrik', 'beige', { storlek: 11 }).setDepth(6);
  // Ett långt namn (t.ex. "Bolagets förtroende" bredvid ett räknarkort) krymps så att det ryms i kortet.
  if (namn.width > b - 28) namn.setScale((b - 28) / namn.width);
  const stapelB = b - 28;
  const stapel = scene.add.graphics().setDepth(6);
  let andel = 1;
  const ritaStapel = (fyll: number) => {
    stapel.clear();
    if (b <= 0) return;
    stapel.fillStyle(farg.gron, 1).fillRoundedRect(x0 + 14, INFO_Y + 36, stapelB, 8, 4);
    if (andel > 0) stapel.fillStyle(fyll, 1).fillRoundedRect(x0 + 14, INFO_Y + 36, Math.max(8, stapelB * andel), 8, 4);
  };

  let visaRaknare = (_kvar: number, _totalt: number) => {};
  let visaSumma = (_text: string) => {};
  if (raknare) {
    const rx = b > 0 ? x0 + b + mellan : x0;
    kortRuta(rx, rakB);
    skapaText(scene, rx + 14, INFO_Y + 12, raknare.namn, 'overrubrik', 'beige', { storlek: 11 }).setDepth(6);
    const varde = skapaText(scene, rx + 14, INFO_Y + 28, '', 'rubrik', 'ljusbeige', { storlek: 18 }).setDepth(6);
    visaRaknare = (kvar, totalt) => varde.setText(raknare.text.replace('{kvar}', String(kvar)).replace('{totalt}', String(totalt)));
    visaSumma = (text) => varde.setText(text);
  }

  let visaTid = (_s: number) => {};
  if (tid) {
    const tx = x0 + helB - tidB;
    kortRuta(tx, tidB);
    skapaText(scene, tx + 14, INFO_Y + 12, tid.etikett, 'overrubrik', 'beige', { storlek: 11 }).setDepth(6);
    const varde = skapaText(scene, tx + 14, INFO_Y + 26, '', 'rubrik', 'guld', { storlek: 22 }).setDepth(6);
    visaTid = (sekunder) => visaKlocka(varde, sekunder);
  }

  return {
    tak: INFO_Y + h,
    visaRaknare,
    visaSumma,
    visaTid,
    visaMatare: (steg: number) => {
      andel = m.lage === 'fyll' ? Math.min(1, steg / m.steg) : Math.max(0, (m.steg - steg) / m.steg);
      ritaStapel(farg.guld);
    },
    markeraMatare: () => {
      // En enda markering per misstag: stapeln lila en kort stund.
      ritaStapel(farg.lila);
      scene.time.delayedCall(450, () => ritaStapel(farg.guld));
    },
  };
}

/** Mätare som procent kvar uppe till höger, t.ex. "God tro 100 %". Tar klockans plats. */
function byggProcent(scene: Phaser.Scene, m: Matare) {
  const kort = hornkort(scene, m.namn, 'guld');
  return {
    visaMatare: (steg: number) => {
      const kvar = Math.max(0, Math.round(((m.steg - steg) / m.steg) * 100));
      kort.satt(`${kvar} %`);
    },
    markeraMatare: () => {
      // En enda markering per misstag: lila en kort stund, sedan tillbaka till guld.
      kort.farg('lila');
      scene.time.delayedCall(450, () => kort.farg('guld'));
    },
  };
}

/**
 * Räknare uppe till höger: namnet ("INTRÅNG") över antalet steg (misstag). Siffran är ljus vid noll och lila
 * därefter (vinrött syns inte på det mörka kortet).
 */
function byggAntal(scene: Phaser.Scene, m: Matare) {
  const kort = hornkort(scene, m.namn);
  return {
    visaMatare: (steg: number) => {
      kort.satt(String(steg));
      kort.farg(steg > 0 ? 'lila' : 'ljusbeige');
    },
    markeraMatare: () => kort.puls(),
  };
}

function byggMatare(scene: Phaser.Scene, m: Matare) {
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
