/**
 * "Om spelet": vad spelet är, källor, länk till integritetspolicyn, knappen "Nollställ framsteg"
 * (med bekräftelsefråga) och versionsnumret från package.json längst ner.
 */
import { BasScen } from './BaseScene';
import { avstand, farg, radie } from '../config/theme';
import { BREDD, HOJD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import { lankar } from '../config/links';
import { framsteg } from '../core/progress';
import { skapaText } from '../ui/text';
import { fyllStjarna } from '../ui/shapes';
import { ikonKnapp, ritaTillbaka, Knapp } from '../ui/Button';
import { lankKnapp } from '../ui/LinkButton';
import { logotyp } from '../ui/Logo';
import { bekraftelse } from '../ui/Dialog';
import { pratbubbla } from '../ui/Badge';
import { DragScroll } from '../ui/DragScroll';

const X0 = avstand.sida;
const INNER_B = BREDD - avstand.sida * 2;

export class AboutScene extends BasScen {
  private scroll?: DragScroll;

  constructor() {
    super('Om');
  }

  create(): void {
    this.forberedKamera('ljusbeige');
    ikonKnapp(this, 46, 48, 'konturLjus', ritaTillbaka, () => this.bytTill('Title'));
    logotyp(this, MITT_X, 48, 24, 'morkgron');
    skapaText(this, X0 - 2, 104, text.om.rubrik, 'titel', 'morkgron');

    const tryck = (): boolean => !this.scroll?.arDrag();
    let y = 164;
    // Huvudtexten i en ruta med Fylgias stjärna.
    const t = skapaText(this, X0 + 62, y + 20, text.om.text, 'brod', 'morkgron', { bredd: INNER_B - 62 - 20 });
    const h = t.height + 40;
    const g = this.add.graphics().setDepth(-1).fillStyle(farg.beige, 1).fillRoundedRect(X0, y, INNER_B, h, radie.l);
    fyllStjarna(g, X0 + 32, y + 38, 26, farg.lila);
    y += h + avstand.xl;

    skapaText(this, X0, y, text.om.kallorRubrik, 'overrubrik', 'morkockra');
    const k = skapaText(this, X0, y + 22, text.om.kallor, 'brod', 'morkgron', { bredd: INNER_B });
    y = k.y + k.height + avstand.xl;

    lankKnapp(this, MITT_X, y + 26, text.om.integritet, { bredd: INNER_B, hojd: 52, variant: 'konturLjus', kanTryckas: tryck }, lankar.integritet);
    y += 52 + avstand.m;
    new Knapp(this, MITT_X, y + 26, text.om.nollstall, { bredd: INNER_B, hojd: 52, variant: 'konturLjus', kanTryckas: tryck }, () =>
      bekraftelse(this, text.om.nollstallFraga, text.om.nollstallText, text.om.nollstallJa, text.om.avbryt, () => this.nollstall(y)),
    );
    y += 52;

    // Versionsnumret längst ner (eller under innehållet om det inte får plats).
    const vy = Math.max(y + avstand.xl, HOJD - 40);
    skapaText(this, MITT_X, vy, text.om.version(__VERSION__), 'liten', 'morkockra', { origo: [0.5, 0.5] });
    this.scroll = new DragScroll(this, vy + 40);
  }

  private nollstall(y: number): void {
    framsteg.nollstall();
    const p = pratbubbla(this, MITT_X, y - 30, text.om.nollstallt, 'morkgron', 'ljusbeige');
    this.tweens.add({ targets: p, alpha: 0, delay: 1600, duration: 300, onComplete: () => p.destroy() });
  }
}
