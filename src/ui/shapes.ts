/**
 * Ritverktyg för profilens former: den fyruddiga stjärnan, streckade linjer och rundade rektanglar.
 * Allt ritas som platta vektorformer – inga bilder, inga gradienter.
 */
import Phaser from 'phaser';

type Punkt = Phaser.Math.Vector2;

/**
 * Fylgias fyruddiga stjärna, översatt från SVG-pathen
 * "M12 1C13 9 15 11 23 12C15 13 13 15 12 23C11 15 9 13 1 12C9 11 11 9 12 1Z" (rutnät 24×24).
 */
const STJARNA_KURVOR: [number, number][][] = [
  [[12, 1], [13, 9], [15, 11], [23, 12]],
  [[23, 12], [15, 13], [13, 15], [12, 23]],
  [[12, 23], [11, 15], [9, 13], [1, 12]],
  [[1, 12], [9, 11], [11, 9], [12, 1]],
];

/** Punkterna i stjärnans kontur, centrerad i (cx, cy). storlek = bredd spets till spets. */
export function stjarnPunkter(cx: number, cy: number, storlek: number, steg = 14): Punkt[] {
  const skala = storlek / 22;
  const punkter: Punkt[] = [];
  for (const [p0, p1, p2, p3] of STJARNA_KURVOR) {
    const kurva = new Phaser.Curves.CubicBezier(
      new Phaser.Math.Vector2(...p0),
      new Phaser.Math.Vector2(...p1),
      new Phaser.Math.Vector2(...p2),
      new Phaser.Math.Vector2(...p3),
    );
    kurva.getPoints(steg).slice(0, -1).forEach((p) => {
      punkter.push(new Phaser.Math.Vector2(cx + (p.x - 12) * skala, cy + (p.y - 12) * skala));
    });
  }
  return punkter;
}

/** Fylld stjärna. andel = hur stor del från vänster som fylls (1 = hel, 0,5 = halv). */
export function fyllStjarna(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  storlek: number,
  farg: number,
  andel = 1,
): void {
  if (andel <= 0) return;
  const grans = cx - storlek / 2 + storlek * andel;
  const punkter = stjarnPunkter(cx, cy, storlek).map(
    (p) => new Phaser.Math.Vector2(Math.min(p.x, grans), p.y),
  );
  g.fillStyle(farg, 1);
  g.fillPoints(punkter, true);
}

export function konturStjarna(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  storlek: number,
  farg: number,
  tjocklek = 1.5,
): void {
  g.lineStyle(tjocklek, farg, 1);
  g.strokePoints(stjarnPunkter(cx, cy, storlek), true, true);
}

/** Konturpunkter för en rundad rektangel (medurs från övre vänstra hörnet). */
export function rundadRektPunkter(x: number, y: number, b: number, h: number, r: number): Punkt[] {
  const punkter: Punkt[] = [];
  const horn: [number, number, number][] = [
    [x + b - r, y + r, -90],
    [x + b - r, y + h - r, 0],
    [x + r, y + h - r, 90],
    [x + r, y + r, 180],
  ];
  for (const [hx, hy, start] of horn) {
    for (let i = 0; i <= 8; i++) {
      const v = Phaser.Math.DegToRad(start + (i / 8) * 90);
      punkter.push(new Phaser.Math.Vector2(hx + Math.cos(v) * r, hy + Math.sin(v) * r));
    }
  }
  return punkter;
}

/** Ritar en streckad linje längs en punktlista. */
export function streckadLinje(
  g: Phaser.GameObjects.Graphics,
  punkter: Punkt[],
  streck: number,
  mellanrum: number,
  sluten = false,
): void {
  const lista = sluten ? [...punkter, punkter[0]] : punkter;
  let kvar = streck;
  let ritar = true;
  for (let i = 0; i < lista.length - 1; i++) {
    const a = lista[i];
    const b = lista[i + 1];
    const langd = Phaser.Math.Distance.BetweenPoints(a, b);
    let pos = 0;
    while (pos < langd) {
      const del = Math.min(kvar, langd - pos);
      if (ritar) {
        const t0 = pos / langd;
        const t1 = (pos + del) / langd;
        g.lineBetween(
          a.x + (b.x - a.x) * t0,
          a.y + (b.y - a.y) * t0,
          a.x + (b.x - a.x) * t1,
          a.y + (b.y - a.y) * t1,
        );
      }
      pos += del;
      kvar -= del;
      if (kvar <= 0) {
        ritar = !ritar;
        kvar = ritar ? streck : mellanrum;
      }
    }
  }
}

/** Streckad rundad ram, som de låsta korten på kartan. */
export function streckadRam(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  b: number,
  h: number,
  r: number,
  farg: number,
  tjocklek = 1,
): void {
  g.lineStyle(tjocklek, farg, 1);
  streckadLinje(g, rundadRektPunkter(x, y, b, h, r), 4, 3, true);
}
