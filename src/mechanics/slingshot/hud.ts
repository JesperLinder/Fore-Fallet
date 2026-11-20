/**
 * Slangbellans HUD: resultatraden (mätare, skott, kostnad), vindindikatorn, räknaren för fysikblock
 * och kön av kvarvarande skott bredvid slangbellan.
 */
import Phaser from 'phaser';
import { avstand, css, farg, radie } from '../../config/theme';
import { BREDD } from '../../config/display';
import { ritaFigur } from '../art';
import { text } from '../../config/strings';
import type { KastInstallningar, SlangbellaInstallningar } from '../../core/levelTypes';
import { StatKort, matare, prickar } from '../../ui/StatCard';
import { skapaText } from '../../ui/text';

const HUD_Y = 92;
const HUD_H = 58;

export interface SlangbellaHud {
  visaMatare: (varde: number) => void;
  visaKvar: (antal: number) => void;
  visaKostnad: (belopp: number) => void;
}

export function byggHud(scene: Phaser.Scene, inst: SlangbellaInstallningar & { hud: NonNullable<SlangbellaInstallningar['hud']> }): SlangbellaHud {
  const x0 = avstand.l;
  const bMatare = 172;
  const bSkott = 76;
  const bKostnad = 390 - x0 * 2 - bMatare - bSkott - 16;

  const kMatare = new StatKort(scene, x0, HUD_Y, bMatare, HUD_H, inst.hud.matare).setDepth(30);
  const kSkott = new StatKort(scene, x0 + bMatare + 8, HUD_Y, bSkott, HUD_H, inst.hud.projektiler, true).setDepth(30);
  const kKostnad = new StatKort(scene, x0 + bMatare + bSkott + 16, HUD_Y, bKostnad, HUD_H, inst.hud.kostnad, true).setDepth(30);

  const kostnadText = skapaText(scene, 0, -4, '', 'rubrik', 'morkgron', { origo: [0.5, 0.5], storlek: 18 });
  kKostnad.innehall.add(kostnadText);

  return {
    visaMatare: matare(scene, kMatare, bMatare - 24),
    visaKvar: prickar(scene, kSkott, inst.antal),
    visaKostnad: (belopp) => {
      kostnadText.setText(text.kronor(belopp));
      kostnadText.setColor(css(belopp > 0 ? 'vinrod' : 'morkgron'));
    },
  };
}

/**
 * Liten indikator som visar vind/slice: etikett plus pilar i vindens riktning.
 * Antalet pilar (1–3) visar styrkan. Returnerar en funktion som visar en ny vind.
 */
export function byggVindindikator(
  scene: Phaser.Scene,
  vindInst: NonNullable<KastInstallningar['vind']>,
  plats: { x: number; y: number } = { x: avstand.l, y: 166 },
): (vind: { x: number; y: number }) => void {
  const { x, y } = plats;
  const etikett = skapaText(scene, 12, 13, vindInst.etikett, 'etikett', 'ljusbeige', { origo: [0, 0.5], storlek: 11 });
  const b = etikett.width + 62;
  const g = scene.add.graphics().fillStyle(farg.morkgron, 1).fillRoundedRect(0, 0, b, 26, 13);
  const pilar = scene.add.graphics();
  const mitt = etikett.width + 34;
  pilar.setPosition(mitt, 13);
  scene.tweens.add({ targets: pilar, alpha: 0.35, duration: 800, yoyo: true, repeat: -1 });
  const behallare = scene.add.container(x, y, [g, etikett, pilar]).setDepth(30);

  const max = vindInst.variation?.max ?? Math.hypot(vindInst.x, vindInst.y);
  return (vind) => {
    const styrka = Math.hypot(vind.x, vind.y);
    const antal = Phaser.Math.Clamp(Math.ceil((styrka / (max || 1)) * 3), 1, 3);
    pilar.clear().lineStyle(1.5, farg.guld, 1);
    for (let i = 0; i < antal; i++) {
      const dx = (i - (antal - 1) / 2) * 7;
      pilar.beginPath();
      pilar.moveTo(dx - 3, -4);
      pilar.lineTo(dx + 1, 0);
      pilar.lineTo(dx - 3, 4);
      pilar.strokePath();
    }
    pilar.setRotation(Math.atan2(vind.y, vind.x));
    // Liten puls så att spelaren ser att vinden har ändrats.
    scene.tweens.add({ targets: behallare, scale: 1.08, duration: 120, yoyo: true });
  };
}

/** Räknaren uppe till höger för block med "mal", t.ex. "EFTERDEBITERING / 4 år". Returnerar en visa-funktion. */
export function byggRaknare(scene: Phaser.Scene, r: NonNullable<SlangbellaInstallningar['raknare']>): (kvar: number) => void {
  const hoger = BREDD - avstand.l - 56; // lämnar plats åt pausknappen
  const rubrik = skapaText(scene, 0, 28, r.rubrik, 'overrubrik', 'beige', { origo: [0.5, 0], storlek: 10 });
  const varde = skapaText(scene, 0, 42, '', 'rubrik', 'ljusbeige', { origo: [0.5, 0], storlek: 20 });
  const g = scene.add.graphics();
  scene.add.container(0, 0, [g, rubrik, varde]).setDepth(30);
  return (kvar) => {
    varde.setText(r.text.replace('{kvar}', String(kvar)));
    const b = Math.max(rubrik.width, varde.width) + 28;
    const x = hoger - b;
    g.clear().fillStyle(farg.morkgron, 1).fillRoundedRect(x, 20, b, 54, radie.m);
    g.lineStyle(1, farg.gron, 1).strokeRoundedRect(x, 20, b, 54, radie.m);
    rubrik.setX(x + b / 2);
    varde.setX(x + b / 2);
  };
}

/** Kvarvarande skott som små projektiler bredvid slangbellan (när resultatraden saknas). */
export function byggSkottko(scene: Phaser.Scene, utslag: { x: number; y: number }, figur: string, antal: number): (kvar: number) => void {
  const figurer = Array.from({ length: antal }, (_, i) => {
    const g = scene.add.graphics({ x: utslag.x + 52 + i * 22, y: utslag.y + 48 }).setDepth(4).setScale(0.6);
    ritaFigur(g, figur, 0, 0);
    return g;
  });
  // Den som ligger i slangbellan räknas inte: visa kvar − 1.
  return (kvar) => figurer.forEach((g, i) => g.setVisible(i < kvar - 1));
}
