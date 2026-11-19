/** Rutan längst ner i en nivå: "Din fylgia viskar" med uppdragstext och tips. */
import Phaser from 'phaser';
import { avstand, farg, radie } from '../config/theme';
import { BREDD, HOJD } from '../config/display';
import { text } from '../config/strings';
import { skapaText } from './text';
import { fyllStjarna } from './shapes';

export function tipsPanel(scene: Phaser.Scene, uppdrag: string, tips: string): Phaser.GameObjects.Container {
  const marg = avstand.l;
  const inre = 58; // plats för stjärnan till vänster
  const b = BREDD - marg * 2;
  const rubrik = skapaText(scene, inre, 18, text.niva.fylgiaViskar, 'overrubrik', 'morkockra');
  const brodtext = skapaText(scene, inre, 38, `${uppdrag} ${tips}`, 'citat', 'morkgron', {
    bredd: b - inre - avstand.l,
  });
  const h = brodtext.y + brodtext.height + 16;

  const g = scene.add.graphics();
  g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(0, 0, b, h, radie.l);
  g.lineStyle(1, farg.beige, 1).strokeRoundedRect(0, 0, b, h, radie.l);
  fyllStjarna(g, 30, 34, 26, farg.lila);

  return scene.add.container(marg, HOJD - h - marg, [g, rubrik, brodtext]).setDepth(50);
}
