/**
 * Små symboler på memorykortens framsida ("form" i nivåfilen). Varje form ritas centrerad i (0, 0)
 * inom en ruta på ungefär s × s punkter, med streck i färgen c. En ny form = en ny rad i FORMER.
 * Okända namn ritar ingenting (kortet visar då bara texten).
 */
import Phaser from 'phaser';
import { fyllStjarna } from '../../ui/shapes';

type Ritare = (g: Phaser.GameObjects.Graphics, s: number, c: number) => void;

const FORMER: Record<string, Ritare> = {
  // Taklucka: taklinje med en lucka som står på glänt.
  tak: (g, s, c) => {
    g.lineStyle(2, c, 1);
    g.lineBetween(-s / 2, s * 0.25, s / 2, s * 0.25);
    g.strokeRect(-s * 0.25, -s * 0.05, s * 0.5, s * 0.3);
    g.lineBetween(-s * 0.25, -s * 0.05, -s * 0.05, -s * 0.38);
    g.lineBetween(-s * 0.05, -s * 0.38, s * 0.3, -s * 0.38);
  },
  // Golv: plankor.
  golv: (g, s, c) => {
    g.lineStyle(2, c, 1);
    g.strokeRect(-s / 2, -s * 0.3, s, s * 0.6);
    g.lineBetween(-s / 2, -s * 0.1, s / 2, -s * 0.1);
    g.lineBetween(-s / 2, s * 0.1, s / 2, s * 0.1);
    g.lineBetween(-s * 0.15, -s * 0.3, -s * 0.15, -s * 0.1);
    g.lineBetween(s * 0.2, -s * 0.1, s * 0.2, s * 0.1);
    g.lineBetween(-s * 0.05, s * 0.1, -s * 0.05, s * 0.3);
  },
  // Dörr med handtag.
  dorr: (g, s, c) => {
    g.lineStyle(2, c, 1).strokeRect(-s * 0.25, -s * 0.45, s * 0.5, s * 0.9);
    g.fillStyle(c, 1).fillCircle(s * 0.13, s * 0.05, 2);
  },
  // Fönster med spröjs.
  fonster: (g, s, c) => {
    g.lineStyle(2, c, 1).strokeRoundedRect(-s * 0.42, -s * 0.32, s * 0.84, s * 0.64, 4);
    g.lineBetween(0, -s * 0.32, 0, s * 0.32);
    g.lineBetween(-s * 0.42, 0, s * 0.42, 0);
  },
  // Väggpanel: lodräta ribbor.
  vagg: (g, s, c) => {
    g.lineStyle(2, c, 1).strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
    for (const x of [-0.13, 0.13]) g.lineBetween(s * x, -s * 0.4, s * x, s * 0.4);
  },
  // Bakre hörnet: två väggar som möts.
  horn: (g, s, c) => {
    g.lineStyle(2, c, 1);
    g.lineBetween(-s * 0.4, -s * 0.4, -s * 0.4, s * 0.4);
    g.lineBetween(-s * 0.4, s * 0.4, s * 0.4, s * 0.4);
    g.lineBetween(-s * 0.4, s * 0.4, s * 0.1, -s * 0.1);
  },
  // Lukt: tre vågiga streck uppåt.
  lukt: (g, s, c) => {
    g.lineStyle(2, c, 1);
    for (const x of [-0.25, 0, 0.25]) {
      const punkter: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 8; i++) {
        const y = s * 0.4 - (i / 8) * s * 0.8;
        punkter.push(new Phaser.Math.Vector2(s * x + Math.sin(i * 1.2) * s * 0.07, y));
      }
      g.strokePoints(punkter);
    }
  },
  // Droppe (fukt).
  droppe: (g, s, c) => {
    g.fillStyle(c, 1);
    g.fillCircle(0, s * 0.12, s * 0.26);
    g.fillTriangle(-s * 0.22, s * 0.0, s * 0.22, s * 0.0, 0, -s * 0.42);
  },
  // Pratbubbla (en förklaring).
  pratbubbla: (g, s, c) => {
    g.lineStyle(2, c, 1).strokeRoundedRect(-s * 0.45, -s * 0.35, s * 0.9, s * 0.55, 6);
    g.lineBetween(-s * 0.15, s * 0.2, -s * 0.25, s * 0.4);
    g.lineBetween(-s * 0.25, s * 0.4, s * 0.05, s * 0.2);
    g.fillStyle(c, 1);
    for (const x of [-0.2, 0, 0.2]) g.fillCircle(s * x, -s * 0.07, 2);
  },
  stjarna: (g, s, c) => fyllStjarna(g, 0, 0, s, c),
  cirkel: (g, s, c) => void g.lineStyle(2, c, 1).strokeCircle(0, 0, s * 0.4),
};

/** Ritar formen om den finns. Returnerar true om något ritades. */
export function ritaForm(g: Phaser.GameObjects.Graphics, namn: string | undefined, s: number, c: number): boolean {
  const f = namn ? FORMER[namn] : undefined;
  if (!f) return false;
  f(g, s, c);
  return true;
}
