/**
 * Startrutan för nivåer med klocka: "Din fylgia viskar" (uppdrag + tips) visas mitt på skärmen
 * med en "Starta"-knapp. Nivån startar först när spelaren tryckt. Delas av invaders och hybrid.
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import { BREDD, HOJD, MITT_X } from '../../config/display';
import { text } from '../../config/strings';
import { Knapp } from '../../ui/Button';

export function visaStart(scene: Phaser.Scene, tips: Phaser.GameObjects.Container, vidStart: () => void): void {
  const tacke = scene.add.rectangle(MITT_X, HOJD / 2, BREDD, HOJD, farg.morkgron, 0.6).setDepth(45).setInteractive();
  // Panelens höjd = underkanten på dess lägsta text + marginal (grafik har ingen egen storlek).
  const texter = tips.list.filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text);
  const tipsH = Math.max(...texter.map((t) => t.y + t.height)) + 16;
  tips.setY(HOJD / 2 - tipsH / 2 - 40);
  const knapp = new Knapp(scene, MITT_X, tips.y + tipsH + 48, text.niva.starta, { bredd: 200, variant: 'guld' }, () => {
    tacke.destroy();
    knapp.destroy();
    scene.tweens.add({ targets: tips, alpha: 0, duration: 200, onComplete: () => tips.setVisible(false) });
    vidStart();
  }).setDepth(51);
}
