/**
 * Figurbibliotek: platta vektorfigurer som nivåfilerna refererar till via "utseende".
 * En ny nivå kan återanvända figurerna här. Behövs en ny figur läggs den till här (eller som bild i public/assets/).
 */
import Phaser from 'phaser';
import { farg } from '../config/theme';

type Rita = (g: Phaser.GameObjects.Graphics, x: number, y: number, b: number, h: number) => void;

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

  flagga(g, x, y) {
    g.lineStyle(2, farg.ljusbeige, 1).lineBetween(x, y, x, y - 62);
    g.fillStyle(farg.guld, 1).fillTriangle(x + 1, y - 62, x + 1, y - 44, x + 28, y - 50);
    g.fillStyle(farg.morkgron, 1).fillCircle(x, y, 2.5);
  },
};

/** Ritar en figur. Okända namn ritas som en tydlig platshållare så att felet syns. */
export function ritaFigur(g: Phaser.GameObjects.Graphics, namn: string, x: number, y: number, b = 0, h = 0): void {
  const rita = figurer[namn];
  if (rita) {
    rita(g, x, y, b, h);
    return;
  }
  console.warn(`Okänt utseende "${namn}" – lägg till det i src/mechanics/art.ts`);
  g.lineStyle(1, farg.lila, 1).strokeRect(x - (b || 20) / 2, y - (h || 20) / 2, b || 20, h || 20);
}
