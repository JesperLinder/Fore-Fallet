/**
 * Figurbibliotek: platta vektorfigurer som nivåfilerna refererar till via "utseende".
 * En ny nivå kan återanvända figurerna här. Behövs en ny figur läggs den till här (eller som bild i public/assets/).
 */
import Phaser from 'phaser';
import { farg } from '../config/theme';
import { fyllStjarna, streckadLinje } from '../ui/shapes';

/** f = valfri färg för figurer som kan färgas (t.ex. bilsiluett). */
type Rita = (g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, f?: number) => void;

/** Kolsyretubens kropp (en kapsel under ventilen), relativt figurens mitt. Delas av ritningen och fyllnaden. */
function tubKropp(b: number, h: number) {
  const kb = Math.min(b * 0.66, 28);
  const topp = -h / 2 + h * 0.14;
  return { x: -kb / 2, y: topp, b: kb, h: h / 2 - topp };
}

/** Stående kolsyretub (kapsel med liten ventil) och en abstrakt märkescirkel – inga riktiga varumärken. */
function ritaTub(g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, kropp: number, marke: number): void {
  const k = tubKropp(b, h);
  g.fillStyle(farg.morkgron, 1).fillRoundedRect(x - k.b * 0.2, y - h / 2, k.b * 0.4, h * 0.16, 2);
  g.fillStyle(kropp, 1).fillRoundedRect(x + k.x, y + k.y, k.b, k.h, k.b * 0.42);
  g.fillStyle(marke, 1).fillCircle(x, y + k.y + k.h / 2, k.b * 0.24);
}

/** Enkel person: huvud och rundad kropp i beige, glad eller ledsen mun. (x, y) = mitten. */
function ritaPerson(g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, glad: boolean): void {
  const r = b * 0.42;
  const hy = y - h / 2 + r;
  g.fillStyle(farg.beige, 1).fillCircle(x, hy, r);
  g.fillRoundedRect(x - b / 2, hy + r + 6, b, h - 2 * r - 6, 18);
  g.fillStyle(farg.morkgron, 1).fillCircle(x - r * 0.35, hy - r * 0.1, 2.6).fillCircle(x + r * 0.35, hy - r * 0.1, 2.6);
  g.lineStyle(2.5, farg.morkgron, 1);
  g.beginPath();
  if (glad) g.arc(x, hy + r * 0.05, r * 0.42, Math.PI * 0.2, Math.PI * 0.8);
  else g.arc(x, hy + r * 0.62, r * 0.38, Math.PI * 1.2, Math.PI * 1.8);
  g.strokePath();
}

/** Domstolsbyggnad: trekantigt tak, fyra pelare och trappa. kropp = byggnadens färg, pelare = pelarnas. */
function ritaDomstol(g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, kropp: number, pelare: number): void {
  const tak = h * 0.28;
  const topp = y - h / 2;
  g.fillStyle(kropp, 1);
  g.fillTriangle(x - b / 2, topp + tak, x, topp, x + b / 2, topp + tak);
  g.fillRect(x - b / 2, topp + tak, b, h - tak);
  g.fillStyle(pelare, 1);
  const pb = b * 0.1;
  for (let i = 0; i < 4; i++) g.fillRect(x - b * 0.36 + i * b * 0.24 - pb / 2, topp + tak + h * 0.1, pb, h * 0.5);
  g.fillRect(x - b / 2 + 4, y + h / 2 - h * 0.1, b - 8, h * 0.06);
}

function ritaLokal(g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, tand: boolean): void {
  g.fillStyle(farg.morkgron, 1).fillRect(x - b / 2, y - h / 2, b, h);
  g.fillStyle(tand ? farg.ljusbeige : farg.guld, 1);
  for (const dx of [-0.3, 0, 0.3]) g.fillRect(x + dx * b - b * 0.09, y - h * 0.22, b * 0.18, h * 0.3);
}

type Min = 'arg' | 'forvanad' | 'nojd';

/**
 * Flytdockan (bossen): grön kropp med två torn, tre ljusa luckor, ögon och mun.
 * min: "arg" (sammanbiten, ögonbryn nedåt), "forvanad" (runda ögon, öppen mun), "nojd" (glada ögon, leende).
 */
function ritaFlytdocka(g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, min: Min): void {
  const torn = h * 0.22;
  const tornB = b * 0.15;
  const topp = y - h / 2;
  g.fillStyle(farg.gron, 1);
  g.fillRect(x - b / 2, topp + torn, b, h - torn);
  g.fillRect(x - b / 2, topp, tornB, torn + 1);
  g.fillRect(x + b / 2 - tornB, topp, tornB, torn + 1);
  // Luckor.
  g.fillStyle(farg.beige, 1);
  for (const dx of [-0.22, 0, 0.22]) g.fillRect(x + dx * b - b * 0.08, topp + torn + h * 0.16, b * 0.16, h * 0.06);
  // Ögon.
  const oy = y + h * 0.1;
  const ox = b * 0.17;
  const r = h * 0.07;
  for (const sida of [-1, 1]) {
    const cx = x + sida * ox;
    if (min === 'nojd') {
      g.lineStyle(3, farg.beige, 1);
      g.beginPath();
      g.arc(cx, oy + r * 0.4, r, Math.PI * 1.15, Math.PI * 1.85);
      g.strokePath();
      continue;
    }
    const rr = min === 'forvanad' ? r * 1.3 : r;
    g.fillStyle(farg.ljusbeige, 1).fillCircle(cx, oy, rr);
    g.fillStyle(farg.morkgron, 1).fillCircle(cx + (min === 'arg' ? -sida * rr * 0.25 : 0), oy + (min === 'arg' ? rr * 0.2 : 0), rr * (min === 'forvanad' ? 0.35 : 0.5));
    if (min === 'arg') {
      // Ögonbryn som lutar ned mot mitten.
      g.lineStyle(3, farg.ljusbeige, 1).lineBetween(cx - sida * rr * 1.2, oy - rr * 1.9, cx + sida * rr * 0.9, oy - rr * 1.1);
    }
  }
  // Mun.
  const my = y + h * 0.32;
  g.lineStyle(3, farg.beige, 1);
  if (min === 'forvanad') {
    g.strokeCircle(x, my, h * 0.05);
  } else {
    g.beginPath();
    // Sammanbiten: båge nedåt. Nöjd: leende båge uppåt.
    if (min === 'arg') g.arc(x, my + h * 0.12, b * 0.13, Math.PI * 1.2, Math.PI * 1.8);
    else g.arc(x, my - h * 0.06, b * 0.12, Math.PI * 0.2, Math.PI * 0.8);
    g.strokePath();
  }
}

/** Där en figur kan fyllas (fyllnadsanimationen i invaders), relativt figurens mitt. undefined = hela brickan. */
export function fyllnadsYta(namn: string, b: number, h: number): { x: number; y: number; b: number; h: number } | undefined {
  if (!namn.startsWith('tub-')) return undefined;
  const k = tubKropp(b, h);
  return { x: k.x + 3, y: k.y + 6, b: k.b - 6, h: k.h - 9 };
}

const figurer: Record<string, Rita> = {
  golfboll(g, x, y) {
    g.fillStyle(farg.ljusbeige, 1).fillCircle(x, y, 7);
    g.lineStyle(1, farg.morkgron, 1).strokeCircle(x, y, 7);
    g.fillStyle(farg.morkgron, 1);
    g.fillCircle(x - 2.5, y - 1.5, 1);
    g.fillCircle(x + 2.5, y - 1.5, 1);
    g.fillCircle(x, y + 2.5, 1);
  },

  bil(g, x, y, b = 46, h = 30) {
    const kaross = h * 0.55;
    g.fillStyle(farg.vinrod, 1);
    g.fillRoundedRect(x - b / 2, y - h / 2 + 2, b, kaross + 4, 5);
    g.fillRoundedRect(x - b / 2, y - h / 2 + kaross - 4, b, h * 0.35, 3);
    g.lineStyle(1.2, farg.ljusbeige, 1).strokeRoundedRect(x - b / 2 + 6, y - h / 2 + 5, b - 12, kaross - 6, 3);
    g.fillStyle(farg.morkgron, 1);
    g.fillCircle(x - b / 2 + 10, y + h / 2 - 3, 4);
    g.fillCircle(x + b / 2 - 10, y + h / 2 - 3, 4);
  },

  parkeringsruta(g, x, y, b = 42, h = 26) {
    g.lineStyle(1, farg.morkgron, 1).strokeRoundedRect(x - b / 2, y - h / 2, b, h, 3);
  },

  /** Textmarkör med serifer (I-balk), spelaren i Löpsedeln. b/h = storlek. */
  textmarkor(g, x, y, b = 30, h = 48) {
    const halv = h / 2;
    const ut = b / 2;
    const bage = (sy: number, riktning: 1 | -1) => {
      // Två bågar som möts i stammen, som en serif-I: ")(" uppe och nere.
      for (const sida of [-1, 1]) {
        const kurva = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(x + sida * ut, sy),
          new Phaser.Math.Vector2(x + sida * 2, sy),
          new Phaser.Math.Vector2(x, sy + riktning * h * 0.28),
        );
        g.strokePoints(kurva.getPoints(12));
      }
    };
    g.lineStyle(3.5, farg.ljusbeige, 1);
    g.lineBetween(x, y - halv + h * 0.26, x, y + halv - h * 0.26);
    bage(y - halv, 1);
    bage(y + halv, -1);
  },

  /** Platt bilsiluett (ingen riktig modell), i valfri färg. */
  bilsiluett(g, x, y, b = 44, h = 22, f: number = farg.ljusbeige) {
    g.fillStyle(f, 1);
    g.fillRoundedRect(x - b / 2, y - h * 0.05, b, h * 0.45, 4);
    g.fillRoundedRect(x - b * 0.3, y - h * 0.45, b * 0.56, h * 0.5, { tl: 7, tr: 7, bl: 0, br: 0 });
    g.fillStyle(farg.morkgron, 1);
    g.fillCircle(x - b * 0.28, y + h * 0.42, h * 0.16);
    g.fillCircle(x + b * 0.28, y + h * 0.42, h * 0.16);
  },

  /** Rund stämpel (spelaren i Begagnade bilen). */
  stampel(g, x, y, b = 60) {
    g.fillStyle(farg.beige, 1).fillCircle(x, y, b / 2);
  },

  /** Litet stämpelavtryck (skott). */
  stampelavtryck(g, x, y) {
    g.lineStyle(2, farg.guld, 1).strokeRoundedRect(x - 8, y - 6, 16, 12, 3);
  },

  /** Kolsyretub med ditt märke: grön med guldcirkel. */
  'tub-egen'(g, x, y, b = 40, h = 50) {
    ritaTub(g, x, y, b, h, farg.gron, farg.guld);
  },

  /** Kolsyretub med annans märke: vinröd med lila cirkel. */
  'tub-annan'(g, x, y, b = 40, h = 50) {
    ritaTub(g, x, y, b, h, farg.vinrod, farg.lila);
  },

  /** Påfyllningsmunstycke (spelaren i Kolsyretuberna): mörkgrön kropp med en smal pip uppåt. */
  munstycke(g, x, y, b = 42, h = 52) {
    g.fillStyle(farg.morkgron, 1);
    g.fillRoundedRect(x - b / 2, y - h / 2 + h * 0.34, b, h * 0.66, 7);
    g.fillRect(x - b * 0.14, y - h / 2 + h * 0.06, b * 0.28, h * 0.3);
    g.fillStyle(farg.guld, 1).fillRect(x - b * 0.14, y - h / 2, b * 0.28, h * 0.07);
  },

  /** Liten gasbubbla i guld (skott). */
  gasbubbla(g, x, y) {
    g.fillStyle(farg.guld, 1).fillCircle(x, y, 6);
    g.fillStyle(farg.ljusbeige, 0.6).fillCircle(x - 2, y - 2, 1.6);
  },

  /** Faktura (fysikblock): beige ark med mörka textrader. b/h = blockets storlek. */
  faktura(g, x, y, b = 80, h = 40) {
    g.fillStyle(farg.beige, 1).fillRect(x - b / 2, y - h / 2, b, h);
    g.lineStyle(1.5, farg.morkgron, 1);
    // Raderna i övre delen; nedre högra hörnet lämnas åt etiketten (t.ex. "År 1").
    const rader = Math.max(1, Math.floor((h - 24) / 6) + 1);
    for (let i = 0; i < rader; i++) {
      const langd = (i === 0 ? 0.35 : i % 2 ? 0.5 : 0.3) * b;
      g.lineBetween(x - b / 2 + 9, y - h / 2 + 9 + i * 6, x - b / 2 + 9 + langd, y - h / 2 + 9 + i * 6);
    }
  },

  /** Elmätare i guld med mörk mätartavla. */
  elmatare(g, x, y, b = 30, h = 36) {
    g.fillStyle(farg.guld, 1).fillRoundedRect(x - b / 2, y - h / 2, b, h, 4);
    g.fillStyle(farg.morkgron, 1).fillCircle(x, y - h * 0.05, Math.min(b, h) * 0.3);
    g.lineStyle(2, farg.guld, 1).lineBetween(x, y - h * 0.05, x + b * 0.15, y - h * 0.2);
  },

  /** Ansvarsstjärnan: Fylgias fyruddiga stjärna i lila (projektil). */
  ansvarsstjarna(g, x, y) {
    fyllStjarna(g, x, y, 26, farg.lila);
  },

  /** Flytdockan (bossen) i tre sinnesstämningar. */
  flytdocka(g, x, y, b = 220, h = 130) {
    ritaFlytdocka(g, x, y, b, h, 'arg');
  },
  'flytdocka-forvanad'(g, x, y, b = 220, h = 130) {
    ritaFlytdocka(g, x, y, b, h, 'forvanad');
  },
  'flytdocka-nojd'(g, x, y, b = 220, h = 130) {
    ritaFlytdocka(g, x, y, b, h, 'nojd');
  },

  /** Liten beige bogserbåt med styrhytt (fören åt höger). */
  bogserbat(g, x, y, b = 56, h = 30) {
    g.fillStyle(farg.beige, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(x - b / 2, y),
        new Phaser.Math.Vector2(x + b / 2, y),
        new Phaser.Math.Vector2(x + b * 0.36, y + h * 0.4),
        new Phaser.Math.Vector2(x - b * 0.4, y + h * 0.4),
      ],
      true,
    );
    g.fillRect(x - b * 0.25, y - h * 0.45, b * 0.32, h * 0.45);
    g.fillStyle(farg.morkgron, 1).fillRect(x - b * 0.19, y - h * 0.36, b * 0.2, h * 0.18);
    g.fillStyle(farg.guld, 1).fillRect(x - b * 0.05, y - h * 0.7, b * 0.08, h * 0.25);
  },

  /** Argument: lila kula (projektil i Flytdockan). */
  argument(g, x, y) {
    g.fillStyle(farg.lila, 1).fillCircle(x, y, 9);
    g.fillStyle(farg.ljusbeige, 0.5).fillCircle(x - 3, y - 3, 2.2);
  },

  /** Sköld: en lila stav (sköldläget i invaders). */
  skold(g, x, y, b = 100, h = 10) {
    g.fillStyle(farg.lila, 1).fillRoundedRect(x - b / 2, y - h / 2, b, h, h / 2);
  },

  /** Den skattskyldige: enkel, vänlig figur i beige. */
  skattskyldig(g, x, y, b = 72, h = 120) {
    ritaPerson(g, x, y, b, h, true);
  },
  'skattskyldig-ledsen'(g, x, y, b = 72, h = 120) {
    ritaPerson(g, x, y, b, h, false);
  },

  /** Dokumentikon (kontur) – Skatteverket. f = färg. */
  dokument(g, x, y, b = 22, h = 26, f = farg.guld) {
    g.lineStyle(2, f, 1).strokeRoundedRect(x - b / 2, y - h / 2, b, h, 3);
    for (const dy of [-0.2, 0.05, 0.3]) g.lineBetween(x - b * 0.25, y + dy * h, x + b * 0.25, y + dy * h);
  },

  /** Domarklubba (ikon) – åklagaren. f = färg. */
  klubba(g, x, y, b = 24, h = 24, f = farg.guld) {
    g.lineStyle(3, f, 1).lineBetween(x - b * 0.35, y + h * 0.4, x + b * 0.1, y - h * 0.05);
    g.fillStyle(f, 1);
    g.save();
    g.translateCanvas(x + b * 0.15, y - h * 0.15);
    g.rotateCanvas(-Math.PI / 4);
    g.fillRoundedRect(-b * 0.3, -h * 0.13, b * 0.6, h * 0.26, 2);
    g.restore();
  },

  /** Akten: beige papper med mörka textrader (projektil i Fastighetsforum). */
  akt(g, x, y) {
    g.fillStyle(farg.beige, 1).fillRect(x - 8, y - 10, 16, 20);
    g.lineStyle(1.4, farg.morkgron, 1);
    for (const [dy, l] of [[-5, 9], [-1, 7], [3, 9], [7, 5]] as const) g.lineBetween(x - 5, y + dy, x - 5 + l, y + dy);
  },

  /** Tingsrätt med pelare (mörkgrön, guldpelare). */
  tingsratt(g, x, y, b = 80, h = 80) {
    ritaDomstol(g, x, y, b, h, farg.morkgron, farg.guld);
  },

  /** Domstol som inte vill ta målet: streckad kontur med ett kryss. */
  'domstol-streckad'(g, x, y, b = 80, h = 70) {
    const tak = h * 0.3;
    const pts = [
      new Phaser.Math.Vector2(x - b / 2, y - h / 2 + tak),
      new Phaser.Math.Vector2(x, y - h / 2),
      new Phaser.Math.Vector2(x + b / 2, y - h / 2 + tak),
      new Phaser.Math.Vector2(x + b / 2, y + h / 2),
      new Phaser.Math.Vector2(x - b / 2, y + h / 2),
      new Phaser.Math.Vector2(x - b / 2, y - h / 2 + tak),
    ];
    g.lineStyle(2, farg.morkgron, 1);
    streckadLinje(g, pts, 6, 4);
    g.lineStyle(3, farg.vinrod, 1);
    const k = Math.min(b, h) * 0.22;
    const ky = y + tak / 2;
    g.lineBetween(x - k, ky - k, x + k, ky + k);
    g.lineBetween(x + k, ky - k, x - k, ky + k);
  },

  /** Högsta domstolen: guldfärgad domstol med mörka pelare. */
  'hogsta-domstolen'(g, x, y, b = 90, h = 70) {
    ritaDomstol(g, x, y, b, h, farg.guld, farg.morkgron);
  },

  /** Lokalen: låg mörkgrön byggnad med guldfönster. */
  lokal(g, x, y, b = 70, h = 50) {
    ritaLokal(g, x, y, b, h, false);
  },
  /** Samma lokal upplyst: ljusa fönster och ett varmt guldsken runt. */
  'lokal-tand'(g, x, y, b = 70, h = 50) {
    g.fillStyle(farg.guld, 0.25).fillRoundedRect(x - b / 2 - 8, y - h / 2 - 8, b + 16, h + 16, 12);
    ritaLokal(g, x, y, b, h, true);
  },

  /** Kulle (mörkgrön halvellips) under t.ex. Högsta domstolen. */
  kulle(g, x, y, b = 140, h = 50) {
    g.fillStyle(farg.morkgron, 1).fillEllipse(x, y + h / 2, b, h * 2);
  },

  /** Invändning (fysikblock): vinröd balk. */
  invandning(g, x, y, b = 110, h = 24) {
    g.fillStyle(farg.vinrod, 1).fillRoundedRect(x - b / 2, y - h / 2, b, h, 3);
  },

  /** Platt ufo i lila (inget känt filmufo). */
  ufo(g, x, y) {
    g.fillStyle(farg.lila, 1);
    g.fillEllipse(x, y - 6, 30, 22);
    g.fillEllipse(x, y + 2, 76, 20);
    g.fillStyle(farg.morkgron, 1);
    for (const dx of [-20, 0, 20]) g.fillCircle(x + dx, y + 3, 2);
  },

  /** Uppsägningsbrev: beige papper med vinröda rader. */
  uppsagningsbrev(g, x, y, b = 26, h = 32) {
    g.fillStyle(farg.beige, 1).fillRect(x - b / 2, y - h / 2, b, h);
    g.lineStyle(2, farg.vinrod, 1);
    for (const [dy, l] of [[-8, 0.6], [-1, 0.6], [6, 0.4]] as const) g.lineBetween(x - b * 0.3, y + dy, x - b * 0.3 + b * l, y + dy);
  },

  /** Ko i profil, beige med mörka fläckar. */
  ko(g, x, y) {
    ritaKo(g, x, y, false);
  },

  /** Samma ko med sprattlande ben (växlas med "ko" när den lyfts). */
  'ko-sprattel'(g, x, y) {
    ritaKo(g, x, y, true);
  },

  /** Hästsko i guld (öppningen nedåt). Hästen i Travstallet. */
  hastsko(g, x, y) {
    g.lineStyle(5, farg.guld, 1);
    g.beginPath();
    g.arc(x, y - 1, 8, Math.PI, 0);
    g.strokePath();
    g.lineBetween(x - 8, y - 1, x - 8, y + 9);
    g.lineBetween(x + 8, y - 1, x + 8, y + 9);
    g.fillStyle(farg.morkockra, 1);
    for (const [dx, dy] of [[-8, 4], [8, 4], [-6, -6], [6, -6]]) g.fillCircle(x + dx, y + dy, 0.9);
  },

  /** Ett avtal: papper med textrader. */
  avtal(g, x, y) {
    g.fillStyle(farg.ljusbeige, 1).fillRect(x - 9, y - 11, 18, 22);
    g.lineStyle(1.2, farg.morkgron, 1).strokeRect(x - 9, y - 11, 18, 22);
    g.lineStyle(1, farg.morkgron, 1);
    for (const dy of [-5, -1, 3]) g.lineBetween(x - 5, y + dy, x + 5, y + dy);
    g.lineBetween(x - 5, y + 7, x + 1, y + 7);
  },

  /** Portfölj (borgenär). */
  portfolj(g, x, y, b = 36, h = 26) {
    g.lineStyle(2.5, farg.vinrod, 1).strokeRoundedRect(x - b * 0.2, y - h / 2 - 6, b * 0.4, 9, 3);
    g.fillStyle(farg.vinrod, 1).fillRoundedRect(x - b / 2, y - h / 2, b, h, 5);
    g.fillStyle(farg.ljusbeige, 1).fillRect(x - 3, y - h / 2 + 7, 6, 4);
  },

  /** Stall, fyllt (säljarens). (x, y) = mitten av grunden. */
  stall(g, x, y, b = 160, h = 125) {
    const vagg = h * 0.62;
    g.fillStyle(farg.morkgron, 1);
    g.fillRect(x - b / 2 + 8, y - vagg, b - 16, vagg);
    g.fillTriangle(x - b / 2, y - vagg, x, y - h, x + b / 2, y - vagg);
    g.fillStyle(farg.gron, 1).fillRect(x - b * 0.17, y - vagg * 0.78, b * 0.34, vagg * 0.78);
  },

  /** Stall, streckad kontur (köparens, tomt). */
  'stall-streckat'(g, x, y, b = 160, h = 125) {
    const vagg = h * 0.62;
    const v = (px: number, py: number) => new Phaser.Math.Vector2(px, py);
    g.lineStyle(2, farg.morkgron, 1);
    streckadLinje(g, [v(x - b / 2 + 8, y), v(x - b / 2 + 8, y - vagg), v(x - b / 2, y - vagg), v(x, y - h), v(x + b / 2, y - vagg), v(x + b / 2 - 8, y - vagg), v(x + b / 2 - 8, y)], 6, 5);
    g.lineStyle(2, farg.morkgron, 1).strokeRect(x - b * 0.17, y - vagg * 0.78, b * 0.34, vagg * 0.78);
  },

  flagga(g, x, y) {
    g.lineStyle(2, farg.ljusbeige, 1).lineBetween(x, y, x, y - 62);
    g.fillStyle(farg.guld, 1).fillTriangle(x + 1, y - 62, x + 1, y - 44, x + 28, y - 50);
    g.fillStyle(farg.morkgron, 1).fillCircle(x, y, 2.5);
  },
};

function ritaKo(g: Phaser.GameObjects.Graphics, x: number, y: number, sprattel: boolean): void {
  g.fillStyle(farg.beige, 1);
  // Ben: raka när kon står, utspretade när den sprattlar.
  g.lineStyle(3, farg.beige, 1);
  for (const dx of [-11, -5, 6, 12]) {
    const ut = sprattel ? (dx < 0 ? -5 : 5) : 0;
    g.lineBetween(x + dx, y + 6, x + dx + ut, y + 14);
  }
  g.fillRoundedRect(x - 16, y - 7, 32, 15, 5);
  g.fillRoundedRect(x + 12, y - 12, 12, 11, 3);
  g.fillStyle(farg.morkgron, 1);
  g.fillCircle(x - 7, y - 1, 3.5);
  g.fillCircle(x + 4, y + 2, 2.5);
  g.fillCircle(x + 20, y - 8, 1.3);
}

/** Ritar en figur. Okända namn ritas som en tydlig platshållare så att felet syns. */
export function ritaFigur(g: Phaser.GameObjects.Graphics, namn: string, x: number, y: number, b = 0, h = 0, f?: number): void {
  const rita = figurer[namn];
  if (rita) {
    rita(g, x, y, b, h, f);
    return;
  }
  console.warn(`Okänt utseende "${namn}" – lägg till det i src/mechanics/art.ts`);
  g.lineStyle(1, farg.lila, 1).strokeRect(x - (b || 20) / 2, y - (h || 20) / 2, b || 20, h || 20);
}
