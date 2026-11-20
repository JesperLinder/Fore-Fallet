/**
 * Hybridmekaniken: slangbella (Kastare, delad med slangbellan) mot ett mål, medan en formation
 * (Formation, delad med invaders) marscherar nedåt. Formationen går inte att stoppa – man ska hinna före.
 *
 * Projektilerna har en roll: "vinnare" vinner om den stannar i målet (missar den springer den tillbaka),
 * "falla" studsar alltid bort från studsytan och räknas i stjärnkraven. Valfritt: vind som slumpas per kast
 * (med indikator) och hinder – skyltar som pendlar och stoppar kastet. Allt kommer från nivåfilen ("hybrid").
 */
import Phaser from 'phaser';
import type { FargNamn } from '../config/theme';
import { BREDD } from '../config/display';
import type { HybridInstallningar, HybridProjektil, Niva } from '../core/levelTypes';
import { spela } from '../core/sound';
import type { Mekanik, MekanikKontext } from './Mechanic';
import { ritaFigur } from './art';
import { byggBana, type Bana } from './slingshot/course';
import { DJUP_KAST, Kastare, type Kast, type KastSlut } from './slingshot/launcher';
import { Formation } from './common/formation';
import { visaStart } from './common/startPanel';
import { byggFiendeRuta, byggValknappar, ritaFiende } from './hybrid/hud';
import { Hinder } from './hybrid/obstacles';
import { hojd, slumpaVind } from './slingshot/flight';
import { byggVindindikator } from './slingshot/hud';
import { pratbubbla } from '../ui/Badge';
import { skapaText } from '../ui/text';

type Ruta = { x: number; y: number; b: number; h: number };

const INGEN_VIND = { x: 0, y: 0 };
/** Bromsning när en projektil rullar inne i målet, så att den stannar där. */
const MALFRIKTION = 0.25;
/** Galoppfart tillbaka (punkter per sekund) och studsens höjd. */
const GALOPP_FART = 170;
const GALOPP_HOJD = 9;

export class Hybrid implements Mekanik {
  private scene: Phaser.Scene;
  private niva: Niva;
  private inst: HybridInstallningar;
  private bana: Bana;
  private kastare: Kastare;
  private fiender: Formation<{ etikett: string }>;
  private ritaKnappar: () => void;
  private namn: Phaser.GameObjects.Text;
  private hinder?: Hinder;
  /** Vinden för kastet som laddas/flyger just nu, och indikatorn (om nivån har vind). */
  private vind = INGEN_VIND;
  private visaVind?: (vind: { x: number; y: number }) => void;

  private valt: HybridProjektil;
  /** Projektilen som kastades senast (valet kan inte ändras under kastet, men sparas för säkerhets skull). */
  private kastat?: HybridProjektil;
  private studsat = false;
  private visadeTexter = new Set<string>();

  private startad = false;
  private pausad = false;
  private klar = false;
  /** Sant medan hästen ligger kvar/springer tillbaka efter en miss. */
  private upptagen = false;
  private forsok = 0;
  private fallor = 0;

  constructor(private kontext: MekanikKontext) {
    this.scene = kontext.scene;
    this.niva = kontext.niva;
    if (!this.niva.hybrid) throw new Error(`Nivån "${this.niva.id}" saknar "hybrid"-inställningar`);
    this.inst = this.niva.hybrid;
    this.valt = this.inst.projektiler.find((p) => p.id === this.inst.startval) ?? this.inst.projektiler[0];

    this.bana = byggBana(this.scene, this.niva);
    const f = this.inst.fiender;
    this.fiender = new Formation(this.scene, f, ritaFiende(f.utseende));
    if (this.inst.hud) byggFiendeRuta(this.scene, this.inst.hud, this.fiender.objekt.length);
    if (this.inst.hinder?.length) this.hinder = new Hinder(this.scene, this.inst.hinder);
    const v = this.inst.kast.vind;
    if (v) this.visaVind = byggVindindikator(this.scene, v, v.plats);

    this.kastare = new Kastare({
      scene: this.scene,
      niva: this.niva,
      inst: this.inst.kast,
      utslag: this.bana.utslag,
      kanSikta: () => this.startad && !this.klar && !this.upptagen,
      utseende: () => this.valt.utseende,
      vind: () => this.vind,
      markfriktion: (x, y) => (inne(this.inst.mal, x, y) ? MALFRIKTION : this.inst.kast.friktion.mark),
      vidSkott: () => this.vidSkott(),
      vidSteg: (k) => this.vidSteg(k),
      vidSlut: (_k, x, y, orsak) => this.landat(x, y, orsak),
    });

    const { x, y } = this.bana.utslag;
    this.namn = skapaText(this.scene, x, y + 68, '', 'rubrik', 'morkgron', { origo: [0.5, 0.5], storlek: 15 }).setDepth(DJUP_KAST.projektil);
    this.ritaKnappar = byggValknappar(this.scene, this.inst.projektiler, () => this.valt.id, (p) => this.valj(p));
    this.ladda();

    visaStart(this.scene, kontext.tips, () => (this.startad = true));
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }

  // ---------- Val och laddning ----------

  private valj(p: HybridProjektil): void {
    if (this.klar || this.upptagen || this.kastare.flyger || p.id === this.valt.id) return;
    this.valt = p;
    this.ritaKnappar();
    this.kastare.ritaProjektil();
    this.visaNamn();
  }

  private ladda(): void {
    const v = this.inst.kast.vind;
    if (v) {
      this.vind = slumpaVind(v);
      this.visaVind?.(this.vind);
    }
    this.kastare.laddaNasta();
    this.visaNamn();
  }

  private visaNamn(): void {
    this.namn.setText(this.valt.namn ?? '').setVisible(true);
  }

  // ---------- Kast ----------

  private vidSkott(): void {
    this.kastat = this.valt;
    this.studsat = false;
    this.namn.setVisible(false);
    if (this.valt.roll === 'vinnare') this.forsok += 1;
    else this.fallor += 1;
  }

  /** Hinder stoppar allt som kastas. Fällor studsar bort när de når studsytan. */
  private vidSteg(k: Kast): void {
    const { x, y } = k.kropp.position;
    // Skylten står upp, så kollisionen räknas där projektilen syns (med höjden över marken).
    const skylt = this.hinder?.traff(x, y - hojd(k.steg, k.flygsteg, k.styrka));
    if (skylt) {
      this.scene.matter.body.setVelocity(k.kropp, { x: 0, y: 0 });
      k.flygsteg = Math.min(k.flygsteg, k.steg); // faller ner där den är
      spela('misstag');
      if (skylt.text && !this.visadeTexter.has(`hinder:${skylt.etikett}`)) {
        this.visadeTexter.add(`hinder:${skylt.etikett}`);
        this.popup(Phaser.Math.Clamp(x, 110, BREDD - 110), y - 40, skylt.text, 'vinrod', 'ljusbeige', 2000);
      }
      return;
    }
    if (this.kastat?.roll !== 'falla' || this.studsat) return;
    if (!inne(this.inst.studsyta ?? this.inst.mal, x, y)) return;
    this.studsat = true;
    const v = k.kropp.velocity;
    this.scene.matter.body.setVelocity(k.kropp, { x: -Math.abs(v.x) * 0.6 - 1.5, y: Math.abs(v.y) * 0.4 + 1 });
    k.flygsteg = Math.min(k.flygsteg, k.steg + 8); // landar strax efter studsen
    spela('misstag');
    this.visaForstaText(this.kastat, x, y - 30);
  }

  private landat(x: number, y: number, orsak: KastSlut): void {
    const p = this.kastat ?? this.valt;
    if (p.roll === 'falla') {
      this.visaForstaText(p, Phaser.Math.Clamp(x, 90, BREDD - 90), Phaser.Math.Clamp(y, 160, 600) - 30);
      this.lamnaKvar(p, x, y, true);
      this.scene.time.delayedCall(700, () => !this.klar && this.ladda());
      return;
    }
    if (orsak === 'stannat' && inne(this.inst.mal, x, y)) {
      this.vinna(p, x, y);
      return;
    }
    this.miss(p, x, y);
  }

  /** Vinnaren missade: ligger kvar en stund, galopperar sedan tillbaka och laddas igen. */
  private miss(p: HybridProjektil, x: number, y: number): void {
    this.upptagen = true;
    const plan = this.inst.kast.spelplan;
    const fig = this.lamnaKvar(p, Phaser.Math.Clamp(x, plan.x + 16, plan.x + plan.b - 16), Phaser.Math.Clamp(y, plan.y + 16, plan.y + plan.h - 16), false);
    const aterkomst = p.aterkomst ?? { vantaMs: 2000, till: this.bana.utslag };
    this.scene.time.delayedCall(aterkomst.vantaMs, () => {
      const fran = new Phaser.Math.Vector2(fig.x, fig.y);
      const till = new Phaser.Math.Vector2(aterkomst.till.x, aterkomst.till.y);
      const forlopp = { t: 0 };
      this.scene.tweens.add({
        targets: forlopp,
        t: 1,
        duration: (fran.distance(till) / GALOPP_FART) * 1000,
        onUpdate: () => {
          const punkt = fran.clone().lerp(till, forlopp.t);
          // Galopp: små studsar längs vägen.
          const studs = Math.abs(Math.sin(forlopp.t * Math.PI * 7)) * GALOPP_HOJD;
          fig.setPosition(punkt.x, punkt.y - studs);
        },
        onComplete: () => {
          fig.destroy();
          this.upptagen = false;
          if (!this.klar) this.ladda();
        },
      });
    });
  }

  /** Ritar projektilen där den landade. Fällor tonas bort. */
  private lamnaKvar(p: HybridProjektil, x: number, y: number, tonaUt: boolean): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics({ x, y }).setDepth(DJUP_KAST.projektil);
    ritaFigur(g, p.utseende, 0, 0);
    if (tonaUt) this.scene.tweens.add({ targets: g, alpha: 0, delay: 300, duration: 500, onComplete: () => g.destroy() });
    return g;
  }

  private visaForstaText(p: HybridProjektil, x: number, y: number): void {
    if (!p.forstaText || this.visadeTexter.has(p.id)) return;
    this.visadeTexter.add(p.id);
    this.popup(x, y, p.forstaText, 'vinrod', 'ljusbeige', 2200);
  }

  // ---------- Loopen, vinst och förlust ----------

  private uppdatera(_tid: number, dt: number): void {
    if (!this.startad || this.pausad || this.klar) return;
    this.fiender.uppdatera(Math.min(dt, 50));
    this.hinder?.uppdatera(Math.min(dt, 50));
    // Formationen har nått stallet. Pågår ett kast får det landa först – det kan vara vinsten.
    if (this.fiender.nedersta() >= this.inst.faraY && !this.kastare.flyger) this.forlora();
  }

  private vinna(p: HybridProjektil, x: number, y: number): void {
    this.klar = true;
    this.lamnaKvar(p, x, y, false);
    spela('traff');
    if (this.inst.vinstText) {
      // Ovanför studsytan (taket) om den finns, annars ovanför målet.
      const m = this.inst.studsyta ?? this.inst.mal;
      const t = skapaText(this.scene, m.x + m.b / 2, m.y - 16, this.inst.vinstText, 'rubrik', 'morkgron', { origo: [0.5, 0.5], storlek: 20 })
        .setDepth(DJUP_KAST.popup)
        .setAlpha(0);
      // Tonar in och blinkar till en gång – inte mer.
      this.scene.tweens.chain({
        targets: t,
        tweens: [
          { alpha: 1, duration: 200 },
          { alpha: 0.2, duration: 220, delay: 250 },
          { alpha: 1, duration: 220 },
        ],
      });
    }
    this.scene.time.delayedCall(1700, () =>
      this.kontext.avsluta({ poang: 0, skadestand: 0, nollstallt: false, forsok: this.forsok, fallor: this.fallor }),
    );
  }

  private forlora(): void {
    this.klar = true;
    spela('misstag');
    this.scene.cameras.main.shake(260, 0.006);
    this.kontext.avsluta({ poang: 0, skadestand: 0, nollstallt: true, forsok: this.forsok, fallor: this.fallor, forlust: 'botten' });
  }

  private popup(x: number, y: number, innehall: string, bakgrund: FargNamn, textFarg: FargNamn, visas = 1100): void {
    const p = pratbubbla(this.scene, x, y, innehall, bakgrund, textFarg).setDepth(DJUP_KAST.popup).setScale(0.6);
    this.scene.tweens.add({ targets: p, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: p, y: y - 18, alpha: 0, delay: visas, duration: 400, onComplete: () => p.destroy() });
  }

  // ---------- Mekanik-gränssnittet ----------

  pausa(pausad: boolean): void {
    this.pausad = pausad;
    this.kastare.pausa(pausad);
  }

  forstor(): void {
    this.kastare.forstor();
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }
}

function inne(r: Ruta, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.b && y >= r.y && y <= r.y + r.h;
}

