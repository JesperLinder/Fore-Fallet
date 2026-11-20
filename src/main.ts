/** Startpunkt: skapar Phaser-spelet i porträtt (390×844 logiska punkter) och registrerar scenerna. */
import Phaser from 'phaser';
import { BREDD, HOJD, ZOOM } from './config/display';
import { farg } from './config/theme';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { MapScene } from './scenes/MapScene';
import { LevelScene } from './scenes/LevelScene';
import { VerdictScene } from './scenes/VerdictScene';
import { SeasonScene } from './scenes/SeasonScene';
import { AboutScene } from './scenes/AboutScene';
import { CongratsScene } from './scenes/CongratsScene';
import { ChapterSelectScene } from './scenes/ChapterSelectScene';
import { ChapterDoneScene } from './scenes/ChapterDoneScene';
import { laasUppLjud, ljudTillstand, pausaLjud } from './core/sound';

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
  scene: [BootScene, TitleScene, ChapterSelectScene, MapScene, LevelScene, VerdictScene, SeasonScene, AboutScene, CongratsScene, ChapterDoneScene],
});

// iOS släpper bara fram ljud som startas inne i ett tryck. Lås upp vid första (och varje) tryck – direkt i
// webbläsarens händelse, före Phaser – så att ljudet fungerar redan från startskärmens "Spela".
for (const typ of ['touchend', 'pointerup', 'click', 'keydown']) {
  document.addEventListener(typ, laasUppLjud, { capture: true, passive: true });
}
// Appen i bakgrunden: tysta ljudet. Det startar igen vid nästa tryck (t.ex. "Fortsätt" i pausmenyn).
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pausaLjud(true);
});

// I utvecklingsläge: gör spelet nåbart från konsolen för felsökning.
if (import.meta.env.DEV) Object.assign(window, { spel, ljudTillstand });
