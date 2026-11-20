/**
 * Spelar en nivå. Läser nivåfilen, ritar banans bakgrund, rubrik och tipsruta,
 * och startar rätt mekanik. När mekaniken är klar räknas stjärnor, sparas och domslutet visas.
 */
import Phaser from 'phaser';
import { BasScen } from './BaseScene';
import { avstand, farg, radie } from '../config/theme';
import { BREDD, HOJD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import { arUpplast, hamtaNiva } from '../core/levels';
import type { ForlustOrsak, Niva } from '../core/levelTypes';
import { framsteg } from '../core/progress';
import { beraknaGuld, beraknaStjarnor } from '../core/scoring';
import { skapaMekanik } from '../mechanics/registry';
import type { Mekanik, MekanikResultat } from '../mechanics/Mechanic';
import { skapaText } from '../ui/text';
import { tipsPanel } from '../ui/TipPanel';
import { Knapp, ikonKnapp, ritaPaus } from '../ui/Button';
import { marke } from '../ui/Badge';

export interface LevelData {
  id: string;
}

export interface DomslutData {
  id: string;
  stjarnor: number;
  /** Sant om guldstjärnan togs den här gången. */
  guld: boolean;
  poang: number;
  skadestand: number;
}

export class LevelScene extends BasScen {
  private niva!: Niva;
  private mekanik!: Mekanik;
  private pausLager?: Phaser.GameObjects.Container;

  constructor() {
    super({
      key: 'Level',
      physics: {
        default: 'matter',
        matter: { gravity: { x: 0, y: 0 }, runner: { fps: 60 }, debug: false },
      },
    });
  }

  create(data: LevelData): void {
    const niva = hamtaNiva(data.id);
    if (!niva || !arUpplast(niva)) {
      this.scene.start('Map');
      return;
    }
    this.niva = niva;
    this.forberedKamera('ljusbeige');
    this.ritaBakgrund();
    this.ritaRubrik();

    const tips = tipsPanel(this, niva.uppdragstext, niva.fylgiaTips);
    this.mekanik = skapaMekanik({ scene: this, niva, tips, avsluta: (r) => this.nivanKlar(r) });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.mekanik.forstor());
    if (niva.mellanstopp) this.visaMellanstopp(niva.mellanstopp);
  }

  /** Svart skärm med en rad text i en sekund innan nivån visas (t.ex. "BOSS – NJA 1997 s. 660"). */
  private visaMellanstopp(innehall: string): void {
    const svart = this.add.rectangle(MITT_X, HOJD / 2, BREDD, HOJD, 0x000000, 1).setDepth(200).setInteractive();
    const t = skapaText(this, MITT_X, HOJD / 2, innehall, 'overrubrik', 'guld', { origo: [0.5, 0.5], storlek: 16 }).setDepth(201);
    this.tweens.add({ targets: [svart, t], alpha: 0, delay: 1000, duration: 350, onComplete: () => [svart, t].forEach((o) => o.destroy()) });
  }

  /** Banans bakgrund: lager med mjukt vågig överkant, från nivåfilens "bana". */
  private ritaBakgrund(): void {
    const g = this.add.graphics().setDepth(0);
    for (const lager of this.niva.bana.lager) {
      const vag = lager.vag ?? 0;
      const punkter: Phaser.Math.Vector2[] = [];
      for (let x = 0; x <= BREDD; x += 10) {
        punkter.push(new Phaser.Math.Vector2(x, lager.topp - Math.sin((x / BREDD) * Math.PI + 0.4) * vag));
      }
      punkter.push(new Phaser.Math.Vector2(BREDD, HOJD), new Phaser.Math.Vector2(0, HOJD));
      g.fillStyle(farg[lager.farg], 1).fillPoints(punkter, true);
    }
  }

  private ritaRubrik(): void {
    const n = this.niva;
    const mork = n.tema === 'mork';
    const over = skapaText(this, avstand.l, 22, text.niva.overrubrik(n.nummer, n.referens), 'overrubrik', mork ? 'guld' : 'morkockra');
    let x = over.x + over.width + 8;
    if (n.rubrikmarke) x += marke(this, x, over.y + over.height / 2, n.rubrikmarke, 'guld', 'morkgron').width + 6;
    if (n.fylgiaMal) marke(this, x, over.y + over.height / 2, text.karta.fylgiaMal);
    skapaText(this, avstand.l - 1, 38, n.titel, 'titel', mork ? 'ljusbeige' : 'morkgron', { storlek: 30 });
    ikonKnapp(this, BREDD - avstand.l - 24, 44, mork ? 'konturMork' : 'mork', ritaPaus, () => this.pausa(true)).setDepth(40);
  }

  // ---------- Paus ----------

  private pausa(pausad: boolean): void {
    this.mekanik.pausa(pausad);
    this.time.paused = pausad;
    if (pausad) {
      this.matter.world.pause();
      this.tweens.pauseAll();
      this.visaPausmeny();
    } else {
      this.matter.world.resume();
      this.tweens.resumeAll();
      this.pausLager?.destroy();
      this.pausLager = undefined;
    }
  }

  private visaPausmeny(): void {
    const tacke = this.add.rectangle(MITT_X, HOJD / 2, BREDD, HOJD, farg.morkgron, 0.7).setInteractive();
    const b = BREDD - avstand.sida * 2;
    const h = 300;
    const y0 = HOJD / 2 - h / 2;
    const panel = this.add.graphics().fillStyle(farg.ljusbeige, 1).fillRoundedRect(avstand.sida, y0, b, h, radie.l);
    const rubrik = skapaText(this, MITT_X, y0 + 44, text.niva.pausRubrik, 'titel', 'morkgron', { origo: [0.5, 0.5] });
    const knappB = b - 48;
    const knappar = [
      new Knapp(this, MITT_X, y0 + 112, text.niva.fortsatt, { bredd: knappB, variant: 'mork' }, () => this.pausa(false)),
      new Knapp(this, MITT_X, y0 + 180, text.niva.borjaOm, { bredd: knappB, variant: 'konturLjus' }, () => this.omstart()),
      new Knapp(this, MITT_X, y0 + 248, text.niva.tillKartan, { bredd: knappB, variant: 'konturLjus' }, () => this.lamna()),
    ];
    this.pausLager = this.add.container(0, 0, [tacke, panel, rubrik, ...knappar]).setDepth(100);
  }

  private omstart(): void {
    this.tweens.resumeAll();
    this.time.paused = false;
    this.scene.restart({ id: this.niva.id });
  }

  private lamna(): void {
    this.tweens.resumeAll();
    this.time.paused = false;
    this.bytTill('Map');
  }

  // ---------- Slut ----------

  private nivanKlar(r: MekanikResultat): void {
    if (r.forlust) {
      this.time.delayedCall(600, () => this.visaForlust(r.forlust!));
      return;
    }
    const stjarnor = beraknaStjarnor(this.niva, r);
    const guld = beraknaGuld(this.niva, r);
    framsteg.sparaResultat(this.niva.id, stjarnor);
    if (guld) framsteg.sparaGuld(this.niva.id);
    const data: DomslutData = { id: this.niva.id, stjarnor, guld, poang: r.poang, skadestand: r.skadestand };
    this.time.delayedCall(500, () => this.bytTill('Verdict', data));
  }

  /** Förlustskärmen: nivåns rubrik, orsaken och "Försök igen". Inget sparas. */
  private visaForlust(orsak: ForlustOrsak): void {
    const f = this.niva.forlust;
    const matarNamn = this.niva.invaders?.matare.namn ?? '';
    const forklaring = f?.orsaker?.[orsak] ?? text.forlust.orsaker[orsak](matarNamn);

    const tacke = this.add.rectangle(MITT_X, HOJD / 2, BREDD, HOJD, farg.morkgron, 0.75).setInteractive();
    const b = BREDD - avstand.sida * 2;
    const knappB = b - 48;
    const rubrik = skapaText(this, MITT_X, 0, f?.rubrik ?? text.forlust.standardRubrik, 'titel', 'ljusbeige', {
      origo: [0.5, 0],
      bredd: b - 40,
      justering: 'center',
    });
    const orsakText = skapaText(this, MITT_X, 0, forklaring, 'ingress', 'beige', { origo: [0.5, 0], bredd: b - 48, justering: 'center' });
    const h = 40 + rubrik.height + 12 + orsakText.height + 32 + 56 + 12 + 56 + 28;
    const y0 = HOJD / 2 - h / 2;
    rubrik.setY(y0 + 40);
    orsakText.setY(rubrik.y + rubrik.height + 12);
    const ky = orsakText.y + orsakText.height + 32 + 28;
    const panel = this.add.graphics().fillStyle(farg.vinrod, 1).fillRoundedRect(avstand.sida, y0, b, h, radie.l);
    panel.lineStyle(1, farg.lila, 1).strokeRoundedRect(avstand.sida, y0, b, h, radie.l);
    const knappar = [
      new Knapp(this, MITT_X, ky, text.forlust.forsokIgen, { bredd: knappB, variant: 'guld' }, () => this.omstart()),
      new Knapp(this, MITT_X, ky + 68, text.forlust.tillKartan, { bredd: knappB, variant: 'konturMork' }, () => this.lamna()),
    ];
    const lager = this.add.container(0, 0, [tacke, panel, rubrik, orsakText, ...knappar]).setDepth(100).setAlpha(0);
    this.tweens.add({ targets: lager, alpha: 1, duration: 220 });
  }
}
