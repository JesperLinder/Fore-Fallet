/**
 * Fylgias logotyp (symbol + ordbild) och fristående symbol, som vektorbilder ur varumärkesmanualen.
 * Filerna i public/assets är vita och färgas här med tint, så samma fil fungerar på alla bakgrunder.
 */
import Phaser from 'phaser';
import { farg, type FargNamn } from '../config/theme';
import { ZOOM } from '../config/display';

export type LogoVariant = 'logotyp' | 'symbol';

const FILER: Record<LogoVariant, string> = {
  logotyp: 'assets/fylgia-logotyp.svg',
  symbol: 'assets/fylgia-symbol.svg',
};

/** SVG:erna är 200 px höga. Rasteriseras så att de räcker för ~60 logiska px i full skärpa. */
const RASTER_SKALA = (60 / 200) * ZOOM;

/** Anropas i BootScene.preload. */
export function laddaLogotyper(scene: Phaser.Scene): void {
  (Object.keys(FILER) as LogoVariant[]).forEach((nyckel) =>
    scene.load.svg(`fylgia-${nyckel}`, FILER[nyckel], { scale: RASTER_SKALA }),
  );
}

export function logotyp(
  scene: Phaser.Scene,
  x: number,
  y: number,
  hojd: number,
  fargNamn: FargNamn,
  variant: LogoVariant = 'logotyp',
  origo: [number, number] = [0.5, 0.5],
): Phaser.GameObjects.Image {
  const bild = scene.add.image(x, y, `fylgia-${variant}`).setOrigin(origo[0], origo[1]).setTint(farg[fargNamn]);
  return bild.setScale(hojd / bild.height);
}
