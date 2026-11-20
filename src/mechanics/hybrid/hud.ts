/**
 * Hybridnivåns gränssnitt: rutan uppe till höger ("Borgenärer / 4 i kö"), knapparna för vad som
 * ska kastas, namnet under slangbellan och hur en borgenär ritas i formationen.
 */
import Phaser from 'phaser';
import { avstand } from '../../config/theme';
import { BREDD, HOJD } from '../../config/display';
import type { HybridInstallningar, HybridProjektil } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { hornkort } from '../../ui/HeaderCard';
import { Knapp } from '../../ui/Button';
import { ritaFigur } from '../art';

const KNAPP_H = 52;
export const KNAPP_Y = HOJD - avstand.l - KNAPP_H / 2;

/** Rutan "Borgenärer / 4 i kö". */
export function byggFiendeRuta(scene: Phaser.Scene, hud: NonNullable<HybridInstallningar['hud']>, antal: number): void {
  hornkort(scene, hud.rubrik).satt(hud.varde.replace('{antal}', String(antal)));
}

/** En borgenär i formationen: portfölj med etikett under. */
export function ritaFiende(utseende: string) {
  return (scene: Phaser.Scene, data: { etikett: string }, _b: number, h: number): Phaser.GameObjects.Container => {
    const g = scene.add.graphics();
    ritaFigur(g, utseende, 0, -h / 2 + 18, 36, 26);
    const t = skapaText(scene, 0, h / 2 - 10, data.etikett, 'knapp', 'morkgron', { origo: [0.5, 0.5], storlek: 12 });
    return scene.add.container(0, 0, [g, t]);
  };
}

/**
 * Knapparna längst ner, en per projektil. Den valda är mörk. Returnerar en funktion som ritar om
 * knapparna (anropas när valet ändras).
 */
export function byggValknappar(
  scene: Phaser.Scene,
  projektiler: HybridProjektil[],
  valt: () => string,
  vidVal: (p: HybridProjektil) => void,
): () => void {
  let knappar: Knapp[] = [];
  const rita = () => {
    knappar.forEach((k) => k.destroy());
    const mellan = 10;
    const b = (BREDD - avstand.l * 2 - mellan * (projektiler.length - 1)) / projektiler.length;
    knappar = projektiler.map((p, i) =>
      new Knapp(
        scene,
        avstand.l + b / 2 + i * (b + mellan),
        KNAPP_Y,
        p.knapp,
        { bredd: b, hojd: KNAPP_H, variant: p.id === valt() ? 'mork' : 'konturLjus' },
        () => vidVal(p),
      ).setDepth(40),
    );
  };
  rita();
  return rita;
}
