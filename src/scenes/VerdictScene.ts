/**
 * Domslutet efter en nivå: stjärnor, rubrik, utfall, domskälen och knappar vidare.
 * Stöder både "vinst" och "halvvagsvinst" (då med rutorna Vunnet / Inte vunnet). Båda ger 0–3 stjärnor;
 * nivåer med "guldstjarna" visar en fjärde, fristående guldstjärna i en mörkgrön medaljong.
 */
import type Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { avstand, farg, radie, type FargNamn } from '../config/theme';
import { BREDD, HOJD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import { arGodkand, arSpelbar, arUpplast, hamtaNiva, nastaNiva } from '../core/levels';
import { spela } from '../core/sound';
import type { Niva } from '../core/levelTypes';
import { skapaText } from '../ui/text';
import { fyllStjarna, konturStjarna, streckadRam } from '../ui/shapes';
import { arPlatshallare } from '../core/placeholders';
import { stjarnRad } from '../ui/Stars';
import { marke } from '../ui/Badge';
import { Knapp } from '../ui/Button';
import { DragScroll } from '../ui/DragScroll';
import { lankKnapp, lankYta } from '../ui/LinkButton';
import { lankar } from '../config/links';
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

    let y = this.ritaHuvud(niva, data.stjarnor, data.guld, halvvags);
    if (halvvags) y = this.ritaVunnetRutor(niva, y + avstand.xl);
    y = this.ritaDomskal(niva, y + avstand.l, halvvags);
    if (niva.fylgiaMal && niva.domslut.fylgiaruta) y = this.ritaFylgiaruta(niva.domslut.fylgiaruta, y + avstand.l);
    y = this.ritaKnappar(niva, y + avstand.xl);
    y = this.ritaKarriar(y + avstand.xl);
    this.scroll = new DragScroll(this, y + avstand.xxl);
  }

  private ritaHuvud(niva: Niva, stjarnor: number, guld: boolean, halvvags: boolean): number {
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

    // Med guldstjärna flyttas raden åt vänster så att raden + medaljongen blir centrerad.
    const radX = niva.guldstjarna ? MITT_X - 31 : MITT_X;
    const rad = stjarnRad(this, radX, 146, stjarnor, { storlek: 34, mellanrum: 12, fyllFarg: 'guld', konturFarg: 'guld' });
    if (niva.guldstjarna) rad.push(this.guldMedaljong(MITT_X + 70, 146, guld));
    rad.forEach((s, i) => {
      s.setScale(0);
      this.tweens.add({ targets: s, scale: 1, delay: 250 + i * 160, duration: 260, ease: 'Back.easeOut' });
    });

    const utfall = niva.domslut.utfall?.[String(Math.floor(stjarnor)) as '0' | '1' | '2' | '3'];
    let y = 178;
    if (niva.guldstjarna) {
      const g = niva.guldstjarna.text;
      const t = skapaText(this, MITT_X, y, guld ? text.domslut.guldTagen(g) : text.domslut.guldKrav(g), 'liten', ph(g, 'morkockra'), {
        origo: [0.5, 0],
        bredd: INNER_B - 20,
        justering: 'center',
      });
      y += t.height + avstand.s;
    }
    for (const rad of [niva.domslut.underrubrik, utfall]) {
      if (!rad) continue;
      const t = skapaText(this, MITT_X, y, rad, 'ingress', ph(rad, 'morkgron'), { origo: [0.5, 0], bredd: INNER_B - 20, justering: 'center' });
      y += t.height + avstand.s;
    }
    if (!niva.domslut.text) return y;
    const sammanfattning = skapaText(this, MITT_X, y, niva.domslut.text, 'brod', ph(niva.domslut.text, 'morkockra'), {
      origo: [0.5, 0],
      bredd: INNER_B - 20,
      justering: 'center',
    });
    return y + sammanfattning.height;
  }

  /** Guldstjärnan: guld i mörkgrön cirkel när den är tagen, annars en svag kontur. */
  private guldMedaljong(x: number, y: number, tagen: boolean): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    if (tagen) {
      g.fillStyle(farg.morkgron, 1).fillCircle(0, 0, 24);
      fyllStjarna(g, 0, 0, 28, farg.guld);
    } else {
      g.lineStyle(1.5, farg.morkgron, 0.35).strokeCircle(0, 0, 24);
      konturStjarna(g, 0, 0, 28, farg.morkgron, 1.5);
      g.setAlpha(0.5);
    }
    return this.add.container(x, y, [g]);
  }

  /**
   * "Vunnet" (mörkgrön) och "Inte vunnet" (streckad) sida vid sida. "Inte vunnet" startar om nivån.
   * Saknar nivån texten "inteVunnet" visas bara "Vunnet", i full bredd.
   */
  private ritaVunnetRutor(niva: Niva, y: number): number {
    if (!niva.domslut.inteVunnet) {
      const vunnet = this.ruta(X0, y, INNER_B, text.domslut.vunnet, niva.domslut.vunnet ?? '', 'guld', 'beige');
      this.add.graphics().setDepth(-1).fillStyle(farg.morkgron, 1).fillRoundedRect(X0, y, INNER_B, vunnet.h, radie.l);
      return y + vunnet.h;
    }
    const b = (INNER_B - avstand.m) / 2;
    const vunnet = this.ruta(X0, y, b, text.domslut.vunnet, niva.domslut.vunnet ?? '', 'guld', 'beige');
    const ix = X0 + b + avstand.m;
    const inte = this.ruta(ix, y, b, text.domslut.inteVunnet, niva.domslut.inteVunnet ?? '', 'vinrod', 'morkgron');
    // Liten "Försök igen" längst ner i rutan; hela rutan är tryckbar.
    const forsok = skapaText(this, ix + 16, y + inte.h - 12, `${text.domslut.forsokIgen} ↻`, 'knapp', 'morkgron', { storlek: 13 });
    const h = Math.max(vunnet.h, inte.h + forsok.height + 4);
    forsok.setY(y + h - forsok.height - 14);
    const g = this.add.graphics().setDepth(-1);
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(X0, y, b, h, radie.l);
    streckadRam(g, ix, y, b, h, radie.l, farg.morkgron);
    const yta = this.add.zone(ix + b / 2, y + h / 2, b, h).setInteractive({ useHandCursor: true });
    yta.on('pointerup', () => {
      if (!this.scroll?.arDrag()) this.bytTill('Level', { id: niva.id });
    });
    return y + h;
  }

  /** Lila ruta med Fylgias text, sist på domslutet (bara Fylgia-mål). */
  private ritaFylgiaruta(innehall: string, y: number): number {
    const t = skapaText(this, X0 + 62, y + 20, innehall, 'brod', ph(innehall, 'morkgron'), { bredd: INNER_B - 62 - 20, storlek: 14 });
    const h = t.height + 40;
    const g = this.add.graphics().setDepth(-1);
    g.fillStyle(farg.lila, 1).fillRoundedRect(X0, y, INNER_B, h, radie.l);
    fyllStjarna(g, X0 + 32, y + h / 2, 26, farg.morkgron);
    return y + h;
  }

  /** Text i en ruta (bakgrunden ritas av anroparen). Returnerar höjden. */
  private ruta(x: number, y: number, b: number, rubrik: string, innehall: string, rubrikFarg: FargNamn, textFarg: FargNamn) {
    skapaText(this, x + 16, y + 18, rubrik, 'overrubrik', rubrikFarg, { storlek: 11 });
    const t = skapaText(this, x + 16, y + 40, innehall, 'brod', ph(innehall, textFarg), { bredd: b - 32, storlek: 14 });
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
      const t = skapaText(this, X0 + 42, ty, skal, 'brod', ph(skal, textFarg), { bredd: INNER_B - 66 }).setDepth(1);
      ty += t.height + avstand.m;
    });
    const h = ty - y + avstand.s;
    g.fillStyle(halvvags ? farg.beige : farg.morkgron, 1).fillRoundedRect(X0, y, INNER_B, h, radie.l);
    return y + h;
  }

  /**
   * Karriärrutan sist: "Gillar du tvister?" med en lila pilknapp. Hela rutan är en länk till karriärsidan.
   * Får innehållet plats står rutan längst ner på skärmen, som i mockupen; annars direkt efter knapparna.
   */
  private ritaKarriar(minY: number): number {
    const k = text.domslut.karriar;
    const pilX = INNER_B - 38;
    const rubrik = skapaText(this, 18, 16, k.rubrik, 'rubrik', 'morkgron', { storlek: 19 });
    const brod = skapaText(this, 18, rubrik.y + rubrik.height + 4, k.text, 'brod', 'morkgron', { storlek: 13, bredd: pilX - 24 - 18 });
    const h = brod.y + brod.height + 16;
    const g = this.add.graphics();
    g.fillStyle(farg.beige, 1).fillRoundedRect(0, 0, INNER_B, h, radie.l);
    g.fillStyle(farg.lila, 1).fillCircle(pilX, h / 2, 23);
    // Pil åt höger.
    g.lineStyle(2, farg.morkgron, 1);
    g.lineBetween(pilX - 7, h / 2, pilX + 7, h / 2);
    g.lineBetween(pilX + 2, h / 2 - 5, pilX + 7, h / 2);
    g.lineBetween(pilX + 2, h / 2 + 5, pilX + 7, h / 2);
    const y = Math.max(minY, HOJD - avstand.l - h);
    this.add.container(X0, y, [g, rubrik, brod]);
    lankYta(this, X0 + INNER_B / 2, y + h / 2, INNER_B, h, `${k.rubrik} ${k.text}`, lankar.karriar);
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
    // Efter sista nivån leder knappen till avslutningsskärmen för säsongen.
    const etikett = behoverStjarna
      ? text.domslut.kravForNasta
      : nasta
        ? text.domslut.nastaMal(nasta.titel)
        : text.domslut.sasongKlar;
    const ny = y + h + avstand.m + 29;
    new Knapp(this, MITT_X, ny, etikett, { bredd: INNER_B, hojd: 56, variant: 'mork', kanTryckas: tryck }, () => {
      if (behoverStjarna) this.bytTill('Level', { id: niva.id });
      else if (nasta && arUpplast(nasta)) this.bytTill('Level', { id: nasta.id });
      else if (!nasta) this.bytTill('Sasong');
      else this.bytTill('Map');
    });
    return ny + 29;
  }
}


/** Platshållartext inom hakparenteser visas i vinrött, så att den syns tydligt vid testning. */
function ph(innehall: string, standard: FargNamn): FargNamn {
  return arPlatshallare(innehall) ? 'vinrod' : standard;
}
