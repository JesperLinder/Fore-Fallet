/** Startpunkt: skapar Phaser-spelet i porträtt (390×844 logiska punkter) och registrerar scenerna. */
import Phaser from 'phaser';
import { BREDD, HOJD, ZOOM } from './config/display';
import { farg } from './config/theme';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { MapScene } from './scenes/MapScene';
import { LevelScene } from './scenes/LevelScene';
import { VerdictScene } from './scenes/VerdictScene';

const spel = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'spel',
  backgroundColor: farg.morkgron,
  width: Math.round(BREDD * ZOOM),
  height: Math.round(HOJD * ZOOM),
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: { antialias: true, roundPixels: false },
  input: { activePointers: 1 },
  // DOM-lager ovanpå canvasen, för riktiga länkar (Safari öppnar bara nya flikar från riktiga länktryck).
  dom: { createContainer: true },
  physics: { default: 'matter' },
  scene: [BootScene, TitleScene, MapScene, LevelScene, VerdictScene],
});

// I utvecklingsläge: gör spelet nåbart från konsolen för felsökning.
if (import.meta.env.DEV) (window as unknown as { spel: Phaser.Game }).spel = spel;
