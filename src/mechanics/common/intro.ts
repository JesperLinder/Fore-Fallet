/**
 * Kort förklaring i steg innan startrutan, t.ex. första gången en nivå spelas. Ett steg i taget i en ljus ruta;
 * tryck var som helst för nästa. När sista steget tryckts bort anropas klar().
 */
import Phaser from 'phaser';
import { avstand, farg, radie } from '../../config/theme';
import { BREDD, HOJD, MITT_X } from '../../config/display';
import { skapaText } from '../../ui/text';
import { text } from '../../config/strings';
import { fyllStjarna } from '../../ui/shapes';

export function visaIntro(scene: Phaser.Scene, steg: string[], klar: () => void): void {
  const tacke = scene.add.rectangle(MITT_X, HOJD / 2, BREDD, HOJD, farg.morkgron, 0.6).setDepth(70).setInteractive();
  const b = BREDD - avstand.l * 2;
  const panel = scene.add.container(avstand.l, HOJD / 2 - 90).setDepth(71);
  let i = 0;
  const rita = () => {
    panel.removeAll(true);
    const nummer = skapaText(scene, 62, 22, `${i + 1} / ${steg.length}`, 'overrubrik', 'morkockra', { storlek: 11 });
    const t = skapaText(scene, 62, 44, steg[i], 'citat', 'morkgron', { bredd: b - 62 - 20 });
    const vidare = skapaText(scene, 62, t.y + t.height + 14, text.niva.tryckForAttFortsatta, 'liten', 'morkockra');
    const h = vidare.y + vidare.height + 20;
    const g = scene.add.graphics().fillStyle(farg.ljusbeige, 1).fillRoundedRect(0, 0, b, h, radie.l);
    fyllStjarna(g, 30, 34, 26, farg.lila);
    panel.add([g, nummer, t, vidare]);
    panel.setScale(0.96).setAlpha(0);
    scene.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 160 });
  };
  rita();
  tacke.on('pointerup', () => {
    i += 1;
    if (i < steg.length) {
      rita();
      return;
    }
    tacke.destroy();
    panel.destroy();
    klar();
  });
}
