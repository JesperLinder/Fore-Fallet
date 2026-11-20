/**
 * Grattisskärmen: visas efter "Säsongen klar" första gången hela spelet är klarat, och kan nås igen från kartan.
 * Mörkgrön bakgrund, "Fylgia" överst, den lila stjärnan som skalas upp från noll och landar mjukt, en enda
 * omgång guldkonfetti (små fyruddiga stjärnor, ingen loop), rubrik, text och knapparna
 * "Sök jobb hos Fylgia" (öppnas i telefonens webbläsare) och "Tillbaka till kartan".
 */
import Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { avstand, farg } from '../config/theme';
import { BREDD, HOJD, MITT_X, ZOOM } from '../config/display';
import { text } from '../config/strings';
import { lankar } from '../config/links';
import { maxTotalaStjarnor } from '../core/levels';
import { framsteg } from '../core/progress';
import { spela } from '../core/sound';
import { skapaText } from '../ui/text';
import { fyllStjarna } from '../ui/shapes';
import { Knapp } from '../ui/Button';
import { lankKnapp } from '../ui/LinkButton';

const STJARNA_Y = 250;
/** Högst så här många konfettibitar, en gång (begränsat för äldre telefoner). */
const KONFETTI_ANTAL = 36;
const KONFETTI_STORLEK = 12;

export class CongratsScene extends BasScen {
  constructor() {
    super('Grattis');
  }

  create(): void {
    this.forberedKamera('morkgron');
    framsteg.sattGrattisSett();

    skapaText(this, MITT_X, 64, text.grattis.logotyp, 'rubrik', 'beige', { origo: [0.5, 0.5], storlek: 30 });

    // Stjärnan skalas upp från noll och landar mjukt.
    const stjarna = this.add.graphics({ x: MITT_X, y: STJARNA_Y });
    fyllStjarna(stjarna, 0, 0, 210, farg.lila);
    stjarna.setScale(0).setAngle(-30);
    this.tweens.add({ targets: stjarna, scale: 1, angle: 0, duration: 1000, delay: 150, ease: 'Back.easeOut' });
    this.time.delayedCall(250, () => spela('jubel'));
    this.konfetti();

    const b = BREDD - avstand.sida * 2 - 8;
    skapaText(this, MITT_X, 420, text.grattis.rubrik, 'titel', 'beige', { origo: [0.5, 0.5], bredd: b, justering: 'center' });
    skapaText(this, MITT_X, 470, text.grattis.underrubrik, 'ingress', 'beige', { origo: [0.5, 0.5], storlek: 26 });
    skapaText(this, MITT_X, 530, text.grattis.text, 'brod', 'beige', { origo: [0.5, 0.5], bredd: 290, justering: 'center', storlek: 16 });

    lankKnapp(this, MITT_X, 640, text.grattis.sokJobb, { bredd: b, hojd: 56, variant: 'guld' }, lankar.sokJobb);
    new Knapp(this, MITT_X, 708, text.grattis.tillKartan, { bredd: b, hojd: 56, variant: 'konturMork' }, () => this.bytTill('Map'));

    const total = framsteg.totalaStjarnor().toLocaleString('sv-SE', { maximumFractionDigits: 1 });
    skapaText(this, MITT_X, HOJD - 44, text.grattis.stjarnor(total, maxTotalaStjarnor()), 'liten', 'beige', { origo: [0.5, 0.5], storlek: 13 });
  }

  /** En omgång guldkonfetti: små fyruddiga stjärnor som faller en gång och sedan tas bort. */
  private konfetti(): void {
    const nyckel = 'konfetti-stjarna';
    if (!this.textures.exists(nyckel)) {
      // Ritas en gång i skärmens pixeltäthet och återanvänds som bild (billigare än en grafik per bit).
      const s = KONFETTI_STORLEK * ZOOM;
      const g = this.add.graphics();
      fyllStjarna(g, s / 2, s / 2, s, farg.guld);
      g.generateTexture(nyckel, s, s);
      g.destroy();
    }
    for (let i = 0; i < KONFETTI_ANTAL; i++) {
      const x = Phaser.Math.Between(10, BREDD - 10);
      const bit = this.add.image(x, Phaser.Math.Between(-80, -10), nyckel).setScale((Phaser.Math.FloatBetween(0.6, 1.2)) / ZOOM).setDepth(10);
      this.tweens.add({
        targets: bit,
        y: HOJD + 20,
        x: x + Phaser.Math.Between(-50, 50),
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(2400, 4000),
        delay: Phaser.Math.Between(200, 1100),
        ease: 'Sine.easeIn',
        onComplete: () => bit.destroy(),
      });
    }
  }
}
