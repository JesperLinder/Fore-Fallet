/** Resultatraden överst i en slangbellenivå: mätare, återstående skott och kostnad. Plus vindindikatorn. */
import Phaser from 'phaser';
import { avstand, css, farg } from '../../config/theme';
import { text } from '../../config/strings';
import type { SlangbellaInstallningar } from '../../core/levelTypes';
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

/** Liten indikator som visar vind/slice: etikett plus pilar som glider i vindens riktning. */
export function byggVindindikator(scene: Phaser.Scene, inst: SlangbellaInstallningar): void {
  const x = avstand.l;
  const y = 166;
  const etikett = skapaText(scene, 12, 13, inst.vind.etikett, 'etikett', 'ljusbeige', { origo: [0, 0.5], storlek: 11 });
  const b = etikett.width + 58;
  const g = scene.add.graphics().fillStyle(farg.morkgron, 1).fillRoundedRect(0, 0, b, 26, 13);
  const pilar = scene.add.graphics();
  const vinkel = Math.atan2(inst.vind.y, inst.vind.x);
  pilar.lineStyle(1.5, farg.guld, 1);
  for (const dx of [0, 9]) {
    pilar.beginPath();
    pilar.moveTo(dx - 3, -4);
    pilar.lineTo(dx + 1, 0);
    pilar.lineTo(dx - 3, 4);
    pilar.strokePath();
  }
  pilar.setPosition(etikett.width + 26, 13).setRotation(vinkel);
  scene.tweens.add({ targets: pilar, x: pilar.x + 6, alpha: 0.3, duration: 800, repeat: -1 });
  scene.add.container(x, y, [g, etikett, pilar]).setDepth(30);
}
