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

  // ---------- Kapitel 2: Tvättvattnet (macken) ----------

  /** Bensinpump utan märke: mörk kropp, ljus display, slang och munstycke. */
  pump(g, x, y, b, h) {
    const B = b || 44;
    const H = h || 92;
    const topp = y - H / 2;
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(x - B / 2, topp, B, H - 6, 6);
    g.fillRect(x - B / 2 - 4, y + H / 2 - 8, B + 8, 8);
    g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(x - B / 2 + 6, topp + 8, B - 12, H * 0.22, 3);
    g.fillStyle(farg.morkgron, 1);
    g.fillRect(x - B / 2 + 10, topp + 13, B * 0.32, 3).fillRect(x - B / 2 + 10, topp + 19, B * 0.5, 3);
    g.fillStyle(farg.gron, 1).fillRoundedRect(x - B / 2 + 6, topp + H * 0.4, B - 12, H * 0.16, 3);
    // Slang och munstycke på sidan.
    g.lineStyle(3, farg.gron, 1);
    g.beginPath();
    g.moveTo(x + B / 2, topp + H * 0.35);
    g.lineTo(x + B / 2 + 7, topp + H * 0.5);
    g.lineTo(x + B / 2 + 7, topp + H * 0.72);
    g.strokePath();
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(x + B / 2 + 3, topp + H * 0.7, 9, 14, 2);
  },

  /** Tvätthink med vatten och en borste. */
  hink(g, x, y, b, h) {
    const B = b || 30;
    const H = h || 26;
    const topp = y - H / 2;
    g.fillStyle(farg.gron, 1).fillPoints(
      [
        new Phaser.Math.Vector2(x - B / 2, topp + 3),
        new Phaser.Math.Vector2(x + B / 2, topp + 3),
        new Phaser.Math.Vector2(x + B / 2 - 4, y + H / 2),
        new Phaser.Math.Vector2(x - B / 2 + 4, y + H / 2),
      ],
      true,
    );
    g.fillStyle(farg.beige, 1).fillEllipse(x, topp + 3, B - 4, 6);
    g.lineStyle(1.5, farg.morkgron, 1).strokeEllipse(x, topp + 3, B, 7);
    // Borsten sticker upp.
    g.lineStyle(3, farg.morkockra, 1).lineBetween(x + 3, topp + 2, x + B * 0.42, topp - H * 0.55);
    g.fillStyle(farg.morkockra, 1).fillRoundedRect(x + B * 0.42 - 5, topp - H * 0.55 - 6, 10, 7, 2);
  },

  /** Kassören bakom disken (spelaren): huvud, mörk tröja och en guldfärgad namnskylt. */
  kassor(g, x, y, b, h) {
    const B = b || 44;
    const H = h || 54;
    const r = B * 0.3;
    const hy = y - H / 2 + r;
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(x - B / 2, hy + r + 3, B, H - 2 * r - 3, { tl: 16, tr: 16, bl: 4, br: 4 });
    g.fillStyle(farg.beige, 1).fillCircle(x, hy, r);
    g.lineStyle(1.5, farg.morkgron, 1).strokeCircle(x, hy, r);
    g.fillStyle(farg.morkgron, 1).fillCircle(x - r * 0.35, hy - r * 0.05, 1.8).fillCircle(x + r * 0.35, hy - r * 0.05, 1.8);
    g.lineStyle(1.8, farg.morkgron, 1);
    g.beginPath();
    g.arc(x, hy + r * 0.1, r * 0.42, Math.PI * 0.2, Math.PI * 0.8);
    g.strokePath();
    g.fillStyle(farg.guld, 1).fillRoundedRect(x + B * 0.08, hy + r + 10, B * 0.26, 7, 2);
  },

  /** Kassadisken: en lång mörk disk med ljus skiva och en liten kassaapparat. */
  kassadisk(g, x, y, b, h) {
    const B = b || 390;
    const H = h || 50;
    g.fillStyle(farg.morkgron, 1).fillRect(x - B / 2, y - H / 2, B, H);
    g.fillStyle(farg.gron, 1).fillRect(x - B / 2, y - H / 2, B, 7);
    g.fillStyle(farg.beige, 1).fillRoundedRect(x - B / 2 + 14, y - H / 2 + 14, 54, 24, 3);
    g.fillStyle(farg.morkgron, 1).fillRect(x - B / 2 + 20, y - H / 2 + 19, 26, 6);
  },

  /** Kund: liten rund figur i guld med ett kvitto. */
  kund(g, x, y, b) {
    const r = (b || 34) * 0.42;
    g.fillStyle(farg.guld, 1).fillCircle(x - 3, y, r);
    g.fillStyle(farg.morkgron, 1).fillCircle(x - 3 - r * 0.35, y - r * 0.2, 1.8).fillCircle(x - 3 + r * 0.35, y - r * 0.2, 1.8);
    g.lineStyle(1.6, farg.morkgron, 1);
    g.beginPath();
    g.arc(x - 3, y + r * 0.05, r * 0.4, Math.PI * 0.2, Math.PI * 0.8);
    g.strokePath();
    // Kvittot: en liten lapp med taggig underkant och två rader.
    const kx = x + r * 0.55;
    const ky = y - 2;
    g.fillStyle(farg.ljusbeige, 1).fillRect(kx, ky - 7, 11, 13);
    g.fillTriangle(kx, ky + 6, kx + 3.7, ky + 6, kx + 1.8, ky + 9);
    g.fillTriangle(kx + 3.7, ky + 6, kx + 7.3, ky + 6, kx + 5.5, ky + 9);
    g.fillTriangle(kx + 7.3, ky + 6, kx + 11, ky + 6, kx + 9.2, ky + 9);
    g.lineStyle(1, farg.morkgron, 1).strokeRect(kx, ky - 7, 11, 13);
    g.lineBetween(kx + 2.5, ky - 3, kx + 8.5, ky - 3).lineBetween(kx + 2.5, ky + 1, kx + 7, ky + 1);
  },

  /** En skugga som smyger: mörk, halvgenomskinlig figur med luva och en flaska. */
  skugga(g, x, y, b, h) {
    const B = b || 34;
    const H = h || 56;
    g.fillStyle(farg.morkgron, 0.82);
    g.fillCircle(x, y - H / 2 + B * 0.28, B * 0.28);
    g.fillRoundedRect(x - B / 2, y - H / 2 + B * 0.5, B, H - B * 0.5, { tl: 14, tr: 14, bl: 3, br: 3 });
    g.fillStyle(farg.vinrod, 1).fillRoundedRect(x + B / 2 - 2, y - 4, 8, 15, 2);
    g.fillRect(x + B / 2, y - 9, 4, 6);
  },

  /** Bil från sidan (som tvättar rutan). f = lackens färg. */
  macbil(g, x, y, b, h, f = farg.vinrod) {
    const B = b || 100;
    const H = h || 46;
    const botten = y + H / 2 - 9;
    g.fillStyle(f, 1).fillRoundedRect(x - B / 2, botten - H * 0.42, B, H * 0.42, 7);
    g.fillRoundedRect(x - B * 0.3, y - H / 2, B * 0.55, H * 0.45, { tl: 10, tr: 10, bl: 0, br: 0 });
    g.fillStyle(farg.ljusbeige, 1);
    g.fillRoundedRect(x - B * 0.25, y - H / 2 + 5, B * 0.21, H * 0.3, 3);
    g.fillRoundedRect(x + B * 0.0, y - H / 2 + 5, B * 0.2, H * 0.3, 3);
    g.fillStyle(farg.morkgron, 1).fillCircle(x - B * 0.3, botten, 9).fillCircle(x + B * 0.3, botten, 9);
    g.fillStyle(farg.beige, 1).fillCircle(x - B * 0.3, botten, 3.5).fillCircle(x + B * 0.3, botten, 3.5);
  },

  /** Kalenderlapp: ljust papper med vinröd kant och två ringar. Texten ("1 april") läggs ovanpå. */
  kalenderlapp(g, x, y, b, h) {
    const B = b || 50;
    const H = h || 44;
    g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(x - B / 2, y - H / 2, B, H, 4);
    g.fillStyle(farg.vinrod, 1).fillRoundedRect(x - B / 2, y - H / 2, B, 11, { tl: 4, tr: 4, bl: 0, br: 0 });
    g.lineStyle(1, farg.morkgron, 1).strokeRoundedRect(x - B / 2, y - H / 2, B, H, 4);
    g.fillStyle(farg.morkgron, 1).fillCircle(x - B * 0.24, y - H / 2, 2.5).fillCircle(x + B * 0.24, y - H / 2, 2.5);
  },

  // ---------- Kapitel 2: Semesterdagarna ----------

  /** Kalenderblad: ett blad i färgen f med mörk list och två ringar. Texten läggs ovanpå. */
  kalenderblad(g, x, y, b, h, f = farg.beige) {
    ritaKalenderblad(g, x, y, b || 84, h || 60, f);
  },

  /** Kalenderblad för en bra semesterdag: ljust blad med en sol. */
  'kalenderblad-sol'(g, x, y, b, h) {
    const B = b || 84;
    const H = h || 60;
    ritaKalenderblad(g, x, y, B, H, farg.ljusbeige);
    const sy = y + 6;
    g.lineStyle(2, farg.guld, 1);
    for (let i = 0; i < 8; i++) {
      const v = (i / 8) * Math.PI * 2;
      g.lineBetween(x + Math.cos(v) * 11, sy + Math.sin(v) * 11, x + Math.cos(v) * 16, sy + Math.sin(v) * 16);
    }
    g.fillStyle(farg.guld, 1).fillCircle(x, sy, 8);
  },

  /** Korgen (spelaren i Semesterdagarna): bred, beige, med flätade ränder. Texten står på den. */
  korg(g, x, y, b, h) {
    const B = b || 120;
    const H = h || 40;
    const topp = y - H / 2;
    g.fillStyle(farg.beige, 1).fillPoints(
      [
        new Phaser.Math.Vector2(x - B / 2, topp),
        new Phaser.Math.Vector2(x + B / 2, topp),
        new Phaser.Math.Vector2(x + B / 2 - 8, y + H / 2),
        new Phaser.Math.Vector2(x - B / 2 + 8, y + H / 2),
      ],
      true,
    );
    g.fillStyle(farg.guld, 1).fillRoundedRect(x - B / 2 - 3, topp - 4, B + 6, 7, 3);
    g.lineStyle(1, farg.morkockra, 0.35);
    for (let i = 1; i < 6; i++) g.lineBetween(x - B / 2 + (B * i) / 6, topp + 4, x - B / 2 + (B * i) / 6 + (i < 3 ? 2 : -2), y + H / 2);
  },

  /** Husvagn uppifrån: ljus kaross, takluckor och en dragstång framåt (uppåt). */
  husvagn(g, x, y, b, h) {
    const B = b || 64;
    const H = h || 100;
    g.lineStyle(3, farg.beige, 1).lineBetween(x, y - H / 2 - 16, x, y - H / 2);
    g.fillStyle(farg.beige, 1).fillTriangle(x - 9, y - H / 2, x + 9, y - H / 2, x, y - H / 2 - 12);
    g.fillStyle(farg.morkgron, 1).fillRect(x - B / 2 - 5, y - 8, 6, 22).fillRect(x + B / 2 - 1, y - 8, 6, 22);
    g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(x - B / 2, y - H / 2, B, H, 12);
    g.lineStyle(1.5, farg.beige, 1).strokeRoundedRect(x - B / 2 + 5, y - H / 2 + 5, B - 10, H - 10, 9);
    g.fillStyle(farg.beige, 1).fillRoundedRect(x - B * 0.22, y - H * 0.3, B * 0.44, H * 0.16, 3);
    g.fillRoundedRect(x - B * 0.22, y + H * 0.1, B * 0.44, H * 0.16, 3);
  },

  // ---------- Kapitel 2: Oxelhäcken ----------

  /** Häcksax (spelaren): två blad uppåt som korsas vid klipplinjen, guldfärgade handtag nedåt. */
  hacksax(g, x, y, b, h) {
    const B = b || 34;
    const H = h || 44;
    const led = y + H * 0.05;
    g.fillStyle(farg.morkgron, 1);
    g.fillTriangle(x - 3, led, x + 3, led, x - B * 0.28, y - H / 2);
    g.fillTriangle(x - 3, led, x + 3, led, x + B * 0.28, y - H / 2);
    g.lineStyle(1, farg.ljusbeige, 1).lineBetween(x - 1, led - 2, x - B * 0.25, y - H / 2 + 3).lineBetween(x + 1, led - 2, x + B * 0.25, y - H / 2 + 3);
    g.lineStyle(4, farg.guld, 1).lineBetween(x - 2, led, x - B * 0.36, y + H / 2 - 2).lineBetween(x + 2, led, x + B * 0.36, y + H / 2 - 2);
    g.fillStyle(farg.morkgron, 1).fillCircle(x, led, 3.5);
    g.fillStyle(farg.guld, 1).fillCircle(x, led, 1.5);
  },

  /** Villa: ljus fasad med mörk kontur, mörkt tak, fönster och dörr. */
  villa(g, x, y, b, h) {
    ritaVilla(g, x, y, b || 112, h || 110, false);
  },

  /** Grannens villa: som villan, men grannen syns i fönstret. */
  'villa-granne'(g, x, y, b, h) {
    ritaVilla(g, x, y, b || 112, h || 110, true);
  },

  /** Tomtgräns: tunn streckad linje i höjdled, h lång. */
  tomtgrans(g, x, y, _b, h) {
    const H = h || 400;
    g.lineStyle(1.5, farg.morkockra, 0.8);
    streckadLinje(g, [new Phaser.Math.Vector2(x, y - H / 2), new Phaser.Math.Vector2(x, y + H / 2)], 6, 6);
  },

  // ---------- Kapitel 2: Trähuset ----------

  /** Avtalsblankett: beige papper med vikt hörn, textrader och en underskriftsrad. */
  blankett(g, x, y, b, h) {
    ritaBlankett(g, x, y, b || 96, h || 100, false);
  },

  /** Avtalsblankett med huvudkontorets guldstämpel. */
  'blankett-stampel'(g, x, y, b, h) {
    ritaBlankett(g, x, y, b || 96, h || 100, true);
  },

  /** Pärm (spelaren i Trähuset): ljus pärm med guldrygg. Texten står på den. */
  parm(g, x, y, b, h) {
    const B = b || 120;
    const H = h || 44;
    g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(x - B / 2, y - H / 2, B, H, 5);
    g.fillStyle(farg.guld, 1).fillRoundedRect(x - B / 2, y - H / 2, 12, H, { tl: 5, bl: 5, tr: 0, br: 0 });
    g.fillStyle(farg.morkgron, 1).fillCircle(x - B / 2 + 6, y - H * 0.22, 2).fillCircle(x - B / 2 + 6, y + H * 0.22, 2);
  },

  /** Trähusets streckade kontur (vad som ska byggas): väggar 140 × 100 och tak, mitt i (x, y). */
  'hus-kontur'(g, x, y) {
    g.lineStyle(1.5, farg.beige, 0.6);
    const v = (px: number, py: number) => new Phaser.Math.Vector2(x + px, y + py);
    streckadLinje(g, [v(-70, -20), v(-70, 80), v(70, 80), v(70, -20)], 6, 5);
    streckadLinje(g, [v(-85, -20), v(0, -80), v(85, -20), v(-85, -20)], 6, 5);
  },

  /** Trähusets vägg (halva): stående panel i beige med bräder. */
  'hus-vagg'(g, x, y, b, h) {
    const B = b || 70;
    const H = h || 100;
    g.fillStyle(farg.beige, 1).fillRect(x - B / 2, y - H / 2, B, H);
    g.lineStyle(1, farg.morkockra, 0.6);
    for (let px = x - B / 2 + 10; px < x + B / 2; px += 10) g.lineBetween(px, y - H / 2, px, y + H / 2);
  },

  /** Trähusets tak: vinrött sadeltak. b = takfotens bredd, h = höjden. */
  'hus-tak'(g, x, y, b, h) {
    const B = b || 170;
    const H = h || 60;
    g.fillStyle(farg.vinrod, 1).fillTriangle(x - B / 2, y + H / 2, x, y - H / 2, x + B / 2, y + H / 2);
    g.lineStyle(1.5, farg.beige, 1).strokeTriangle(x - B / 2, y + H / 2, x, y - H / 2, x + B / 2, y + H / 2);
  },

  /** Skorsten: liten vinröd stapel med ljus kant. */
  'hus-skorsten'(g, x, y, b, h) {
    const B = b || 16;
    const H = h || 34;
    g.fillStyle(farg.vinrod, 1).fillRect(x - B / 2, y - H / 2, B, H);
    g.lineStyle(1.5, farg.beige, 1).strokeRect(x - B / 2, y - H / 2, B, H);
    g.fillStyle(farg.beige, 1).fillRect(x - B / 2 - 2, y - H / 2 - 3, B + 4, 4);
  },

  /** Fönster: ljust med mörkt spröjs. */
  'hus-fonster'(g, x, y, b, h) {
    const B = b || 36;
    const H = h || 36;
    g.fillStyle(farg.ljusbeige, 1).fillRect(x - B / 2, y - H / 2, B, H);
    g.lineStyle(3, farg.morkgron, 1).strokeRect(x - B / 2, y - H / 2, B, H);
    g.lineBetween(x, y - H / 2, x, y + H / 2).lineBetween(x - B / 2, y, x + B / 2, y);
  },
};

/** Kalenderblad: fyllt blad, mörk list upptill med två ringar och en tunn kontur. */
function ritaKalenderblad(g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, f: number): void {
  const mork = f === farg.vinrod || f === farg.morkgron || f === farg.gron;
  g.fillStyle(f, 1).fillRoundedRect(x - b / 2, y - h / 2, b, h, 5);
  g.fillStyle(mork ? farg.morkgron : farg.morkockra, 1).fillRoundedRect(x - b / 2, y - h / 2, b, 10, { tl: 5, tr: 5, bl: 0, br: 0 });
  g.lineStyle(1.2, mork ? farg.beige : farg.morkgron, 1).strokeRoundedRect(x - b / 2, y - h / 2, b, h, 5);
  g.fillStyle(farg.ljusbeige, 1).fillCircle(x - b * 0.25, y - h / 2 + 5, 2.5).fillCircle(x + b * 0.25, y - h / 2 + 5, 2.5);
}

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

/** Villa med fasad, sadeltak, två fönster och dörr. granne: en person syns i det högra fönstret. */
function ritaVilla(g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, granne: boolean): void {
  const tak = h * 0.36;
  const topp = y - h / 2;
  g.fillStyle(farg.morkgron, 1).fillTriangle(x - b / 2 - 6, topp + tak, x, topp, x + b / 2 + 6, topp + tak);
  g.fillStyle(farg.ljusbeige, 1).fillRect(x - b / 2, topp + tak, b, h - tak);
  g.lineStyle(1.5, farg.morkgron, 1).strokeRect(x - b / 2, topp + tak, b, h - tak);
  const fy = topp + tak + 12;
  const fb = b * 0.24;
  for (const dx of [-0.26, 0.26]) {
    g.fillStyle(farg.beige, 1).fillRect(x + dx * b - fb / 2, fy, fb, fb);
    g.lineStyle(1.5, farg.morkgron, 1).strokeRect(x + dx * b - fb / 2, fy, fb, fb);
  }
  if (granne) {
    // Grannen i det högra fönstret: huvud och axlar.
    const gx = x + 0.26 * b;
    g.fillStyle(farg.morkgron, 1).fillCircle(gx, fy + fb * 0.42, fb * 0.2);
    g.fillRoundedRect(gx - fb * 0.32, fy + fb * 0.66, fb * 0.64, fb * 0.34, { tl: 6, tr: 6, bl: 0, br: 0 });
  }
  g.fillStyle(farg.morkgron, 1).fillRect(x - b * 0.08, y + h / 2 - h * 0.3, b * 0.16, h * 0.3);
}

/** Avtalsblankett: papper med vikt hörn, textrader, underskriftsrad och valfri guldstämpel. */
function ritaBlankett(g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number, stampel: boolean): void {
  const l = x - b / 2;
  const t = y - h / 2;
  const hornet = 12;
  g.fillStyle(farg.beige, 1).fillPoints(
    [
      new Phaser.Math.Vector2(l, t),
      new Phaser.Math.Vector2(l + b - hornet, t),
      new Phaser.Math.Vector2(l + b, t + hornet),
      new Phaser.Math.Vector2(l + b, t + h),
      new Phaser.Math.Vector2(l, t + h),
    ],
    true,
  );
  g.fillStyle(farg.morkockra, 0.35).fillTriangle(l + b - hornet, t, l + b - hornet, t + hornet, l + b, t + hornet);
  g.fillStyle(farg.morkgron, 1).fillRect(l + 8, t + 9, b * 0.45, 4);
  g.fillStyle(farg.morkockra, 0.5);
  for (let i = 0; i < 3; i++) g.fillRect(l + 8, t + 20 + i * 8, b - 16 - (i === 2 ? 22 : 0), 2);
  // Underskriftsrad längst ner; namnet (etiketten) står ovanför.
  g.lineStyle(1.2, farg.morkgron, 1).lineBetween(l + 8, t + h - 9, l + b - 8, t + h - 9);
  if (stampel) {
    const sx = l + b - 22;
    const sy = t + 30;
    g.fillStyle(farg.guld, 1).fillCircle(sx, sy, 13);
    g.lineStyle(1.5, farg.ljusbeige, 1).strokeCircle(sx, sy, 9.5);
    fyllStjarna(g, sx, sy, 12, farg.ljusbeige);
  }
}
