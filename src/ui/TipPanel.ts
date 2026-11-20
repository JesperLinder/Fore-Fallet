/**
 * Rutan längst ner i en nivå: "Din fylgia viskar" med uppdragstext och tips (tipsPanel), och den kortare
 * rutan med bara tipset som kan stå kvar under spelet (spelTips).
 */
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

/** Bara tipset, längst ner under spelet. Mörk ruta på ljust tema, ljus på mörkt. */
export function spelTips(scene: Phaser.Scene, tips: string, tema: 'ljus' | 'mork'): Phaser.GameObjects.Container {
  const marg = avstand.l;
  const inre = 50;
  const b = BREDD - marg * 2;
  const ljus = tema === 'ljus';
  const brodtext = skapaText(scene, inre, 18, tips, 'citat', ljus ? 'ljusbeige' : 'morkgron', { bredd: b - inre - avstand.l });
  const h = brodtext.height + 36;
  const g = scene.add.graphics();
  g.fillStyle(ljus ? farg.morkgron : farg.ljusbeige, 1).fillRoundedRect(0, 0, b, h, radie.l);
  fyllStjarna(g, 26, 30, 22, farg.lila);
  return scene.add.container(marg, HOJD - h - marg, [g, brodtext]).setDepth(25);
}
