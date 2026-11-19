/**
 * Domslutet efter en nivå: stjärnor, rubrik, utfall, domskälen och knappar vidare.
 * Stöder både "vinst" och "halvvagsvinst" (då med rutorna Vunnet / Inte vunnet och max 1,5 stjärnor).
 */
import { BasScen } from './BaseScene';
import { avstand, farg, radie, type FargNamn } from '../config/theme';
import { BREDD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import { arGodkand, arSpelbar, arUpplast, hamtaNiva, nastaNiva } from '../core/levels';
import { spela } from '../core/sound';
import type { Niva } from '../core/levelTypes';
import { skapaText } from '../ui/text';
import { streckadRam } from '../ui/shapes';
import { stjarnRad } from '../ui/Stars';
import { marke } from '../ui/Badge';
import { Knapp } from '../ui/Button';
import { DragScroll } from '../ui/DragScroll';
import { lankKnapp } from '../ui/LinkButton';
import type { DomslutData } from './LevelScene';

const X0 = avstand.sida;
const INNER_B = BREDD - avstand.sida * 2;

export class VerdictScene extends BasScen {
  private scroll?: DragScroll;

  constructor() {
    super('Verdict');
  }

  create(data: DomslutData): void {
    const niva = hamtaNiva(data.id);
    if (!niva || !arSpelbar(niva)) {
      this.scene.start('Map');
      return;
    }
    this.forberedKamera('ljusbeige');
    const halvvags = niva.resultat === 'halvvagsvinst';
    if (data.stjarnor > 0) this.time.delayedCall(250, () => spela('vinst'));

    let y = this.ritaHuvud(niva, data.stjarnor, halvvags);
    if (halvvags) y = this.ritaVunnetRutor(niva, y + avstand.xl);
    y = this.ritaDomskal(niva, y + avstand.l, halvvags);
    y = this.ritaKnappar(niva, y + avstand.xl);
    this.scroll = new DragScroll(this, y + avstand.xxl);
  }

  private ritaHuvud(niva: Niva, stjarnor: number, halvvags: boolean): number {
    const over = skapaText(this, MITT_X, 38, text.domslut.overrubrik(niva.nummer, niva.referens), 'overrubrik', 'morkockra', {
      origo: [0.5, 0.5],
    });
    if (niva.fylgiaMal) {
      const m = marke(this, 0, 38, text.karta.fylgiaMal);
      over.x -= (m.width + 8) / 2;
      m.x = over.x + over.width / 2 + 8;
    }
    const standard = halvvags ? text.domslut.halvvagsRubrik : text.domslut.vinstRubrik;
    skapaText(this, MITT_X, 86, niva.domslut.rubrik ?? standard, 'jatte', 'morkgron', { origo: [0.5, 0.5], storlek: 54 });

    const rad = stjarnRad(this, MITT_X, 146, stjarnor, { storlek: 34, mellanrum: 12, fyllFarg: 'guld', konturFarg: 'guld' });
    rad.forEach((s, i) => {
      s.setScale(0);
      this.tweens.add({ targets: s, scale: 1, delay: 250 + i * 160, duration: 260, ease: 'Back.easeOut' });
    });

    const utfall = niva.domslut.utfall?.[String(Math.floor(stjarnor)) as '0' | '1' | '2' | '3'];
    let y = 178;
    if (utfall) {
      const t = skapaText(this, MITT_X, y, utfall, 'ingress', 'morkgron', { origo: [0.5, 0], bredd: INNER_B - 20, justering: 'center' });
      y += t.height + avstand.s;
    }
    if (!niva.domslut.text) return y;
    const sammanfattning = skapaText(this, MITT_X, y, niva.domslut.text, 'brod', 'morkockra', {
      origo: [0.5, 0],
      bredd: INNER_B - 20,
      justering: 'center',
    });
    return y + sammanfattning.height;
  }

  private ritaVunnetRutor(niva: Niva, y: number): number {
    const b = (INNER_B - avstand.m) / 2;
    const vunnet = this.ruta(X0, y, b, text.domslut.vunnet, niva.domslut.vunnet ?? '', 'guld', 'beige');
    const inte = this.ruta(X0 + b + avstand.m, y, b, text.domslut.inteVunnet, niva.domslut.inteVunnet ?? '', 'vinrod', 'morkgron');
    const h = Math.max(vunnet.h, inte.h);
    const g = this.add.graphics().setDepth(-1);
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(X0, y, b, h, radie.l);
    streckadRam(g, X0 + b + avstand.m, y, b, h, radie.l, farg.morkgron);
    return y + h;
  }

  /** Text i en ruta (bakgrunden ritas av anroparen). Returnerar höjden. */
  private ruta(x: number, y: number, b: number, rubrik: string, innehall: string, rubrikFarg: FargNamn, textFarg: FargNamn) {
    skapaText(this, x + 16, y + 18, rubrik, 'overrubrik', rubrikFarg, { storlek: 11 });
    const t = skapaText(this, x + 16, y + 40, innehall, 'brod', textFarg, { bredd: b - 32, storlek: 14 });
    return { h: t.height + 58 };
  }

  private ritaDomskal(niva: Niva, y: number, halvvags: boolean): number {
    const g = this.add.graphics();
    const rubrikFarg: FargNamn = halvvags ? 'morkockra' : 'guld';
    const nummerFarg: FargNamn = halvvags ? 'morkockra' : 'lila';
    const textFarg: FargNamn = halvvags ? 'morkgron' : 'beige';
    skapaText(this, X0 + 20, y + 22, text.domslut.domskalRubrik, 'overrubrik', rubrikFarg).setDepth(1);

    let ty = y + 52;
    niva.domslut.domskal.forEach((skal, i) => {
      skapaText(this, X0 + 20, ty - 2, String(i + 1), 'rubrik', nummerFarg, { storlek: 18 }).setDepth(1);
      const t = skapaText(this, X0 + 42, ty, skal, 'brod', textFarg, { bredd: INNER_B - 66 }).setDepth(1);
      ty += t.height + avstand.m;
    });
    const h = ty - y + avstand.s;
    g.fillStyle(halvvags ? farg.beige : farg.morkgron, 1).fillRoundedRect(X0, y, INNER_B, h, radie.l);
    return y + h;
  }

  private ritaKnappar(niva: Niva, y: number): number {
    const b = (INNER_B - avstand.m) / 2;
    const h = 52;
    const tryck = () => !this.scroll?.arDrag();
    lankKnapp(this, X0 + b / 2, y + h / 2, text.domslut.lasFallet, { bredd: b, hojd: h, variant: 'konturLjus' }, niva.domslut.lankTillFallet);
    new Knapp(this, X0 + b * 1.5 + avstand.m, y + h / 2, text.domslut.spelaIgen, { bredd: b, hojd: h, variant: 'konturLjus', kanTryckas: tryck }, () =>
      this.bytTill('Level', { id: niva.id }),
    );

    const nasta = nastaNiva(niva.id);
    // Nästa nivå kräver minst en stjärna här: uppmana till ett nytt försök.
    const behoverStjarna = !!nasta && !arGodkand(niva);
    const etikett = behoverStjarna
      ? text.domslut.kravForNasta
      : nasta
        ? text.domslut.nastaMal(nasta.titel)
        : text.domslut.tillKartan;
    const ny = y + h + avstand.m + 29;
    new Knapp(this, MITT_X, ny, etikett, { bredd: INNER_B, hojd: 58, variant: 'mork', kanTryckas: tryck }, () => {
      if (behoverStjarna) this.bytTill('Level', { id: niva.id });
      else if (nasta && arUpplast(nasta)) this.bytTill('Level', { id: nasta.id });
      else this.bytTill('Map');
    });
    return ny + 29;
  }
}

