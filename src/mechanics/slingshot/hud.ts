/** Resultatraden överst i en slangbellenivå: mätare, återstående skott och kostnad. Plus vindindikatorn. */
import Phaser from 'phaser';
import { avstand, css, farg } from '../../config/theme';
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

export function byggHud(scene: Phaser.Scene, inst: SlangbellaInstallningar): SlangbellaHud {
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
