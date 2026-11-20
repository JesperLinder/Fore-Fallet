/**
 * "Kapitel klart": den kortare skärmen efter ett kapitel som inte är det sista (efter det sista visas
 * grattisskärmen med länken till karriärsidan). Kapitlets stjärna i accentfärgen, kapitlets stjärnor och
 * knappen "Till nästa kapitel", som öppnar nästa kapitels karta.
 */
import { BasScen } from './BaseScene';
import { arMork, avstand, farg } from '../config/theme';
import { BREDD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import { allaKapitel, hamtaKapitel, kapitelMaxStjarnor, kapitelStjarnor, nastaKapitel } from '../core/levels';
import { framsteg } from '../core/progress';
import { spela } from '../core/sound';
import { skapaText } from '../ui/text';
import { fyllStjarna } from '../ui/shapes';
import { ikonKnapp, ritaTillbaka, Knapp } from '../ui/Button';

export interface KapitelData {
  kapitel?: string;
}

export class ChapterDoneScene extends BasScen {
  constructor() {
    super('KapitelKlart');
  }

  create(data: KapitelData): void {
    const k = hamtaKapitel(data?.kapitel ?? '') ?? allaKapitel[0];
    const nasta = nastaKapitel(k);
    this.forberedKamera('morkgron');
    framsteg.sattKapitelKlartSett(k.id);
    ikonKnapp(this, 46, 48, 'konturMork', ritaTillbaka, () => this.bytTill('Kapitel'));

    const stjarna = this.add.graphics({ x: MITT_X, y: 240 });
    // Mörka accentfärger syns inte mot den mörkgröna bakgrunden: då blir stjärnan lila.
    fyllStjarna(stjarna, 0, 0, 170, arMork(k.farg) ? farg.lila : farg[k.farg]);
    stjarna.setScale(0).setAngle(-30);
    this.tweens.add({ targets: stjarna, scale: 1, angle: 0, duration: 900, delay: 150, ease: 'Back.easeOut' });
    this.time.delayedCall(250, () => spela('jubel'));

    const b = BREDD - avstand.sida * 2;
    skapaText(this, MITT_X, 384, text.kapitel.nummer(k.nummer), 'overrubrik', 'guld', { origo: [0.5, 0.5] });
    skapaText(this, MITT_X, 424, text.kapitelKlart.rubrik, 'jatte', 'ljusbeige', { origo: [0.5, 0.5], storlek: 44 });
    skapaText(this, MITT_X, 474, k.titel, 'ingress', 'beige', { origo: [0.5, 0.5], bredd: b, justering: 'center', storlek: 24 });
    const stjarnor = text.kapitelKlart.stjarnor(formatera(kapitelStjarnor(k)), kapitelMaxStjarnor(k));
    skapaText(this, MITT_X, 520, stjarnor, 'rubrik', 'guld', { origo: [0.5, 0.5], storlek: 22 });
    if (nasta) {
      skapaText(this, MITT_X, 580, text.kapitelKlart.nasta(nasta.nummer, nasta.titel), 'brod', 'beige', { origo: [0.5, 0.5], bredd: b, justering: 'center' });
    }

    new Knapp(this, MITT_X, 690, text.kapitelKlart.tillNasta, { bredd: b, hojd: 56, variant: 'guld' }, () =>
      nasta ? this.bytTill('Map', { kapitel: nasta.id }) : this.bytTill('Kapitel'),
    );
  }
}

/** 26.5 -> "26,5" */
function formatera(antal: number): string {
  return antal.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
}
