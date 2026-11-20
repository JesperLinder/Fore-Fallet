/**
 * Bekräftelseruta ovanpå scenen: rubrik, text och två knappar (t.ex. "Nollställ" / "Avbryt").
 * Mörkt täcke bakom fångar alla tryck tills spelaren valt.
 */
import Phaser from 'phaser';
import { avstand, farg, radie } from '../config/theme';
import { BREDD, HOJD, MITT_X } from '../config/display';
import { skapaText } from './text';
import { Knapp } from './Button';

export function bekraftelse(
  scene: Phaser.Scene,
  rubrik: string,
  innehall: string,
  jaText: string,
  nejText: string,
  vidJa: () => void,
): void {
  const kamera = scene.cameras.main;
  // Rutan ritas mitt i den del av scenen som syns just nu (scenen kan vara scrollad).
  const mittY = kamera.worldView.centerY || HOJD / 2;
  const b = BREDD - avstand.sida * 2;
  const knappB = b - 48;
  const tacke = scene.add.rectangle(MITT_X, mittY, BREDD, HOJD * 3, farg.morkgron, 0.75).setInteractive();
  const r = skapaText(scene, MITT_X, 0, rubrik, 'titel', 'morkgron', { origo: [0.5, 0], bredd: b - 40, justering: 'center', storlek: 28 });
  const t = skapaText(scene, MITT_X, 0, innehall, 'brod', 'morkgron', { origo: [0.5, 0], bredd: b - 48, justering: 'center' });
  const h = 36 + r.height + 12 + t.height + 28 + 56 + 12 + 56 + 24;
  const y0 = mittY - h / 2;
  r.setY(y0 + 36);
  t.setY(r.y + r.height + 12);
  const ky = t.y + t.height + 28 + 28;
  const panel = scene.add.graphics().fillStyle(farg.ljusbeige, 1).fillRoundedRect(avstand.sida, y0, b, h, radie.l);
  const lager = scene.add.container(0, 0).setDepth(200);
  const stang = (): void => lager.destroy();
  const ja = new Knapp(scene, MITT_X, ky, jaText, { bredd: knappB, variant: 'mork' }, () => {
    stang();
    vidJa();
  });
  const nej = new Knapp(scene, MITT_X, ky + 68, nejText, { bredd: knappB, variant: 'konturLjus' }, stang);
  lager.add([tacke, panel, r, t, ja, nej]);
  lager.setAlpha(0);
  scene.tweens.add({ targets: lager, alpha: 1, duration: 180 });
}
