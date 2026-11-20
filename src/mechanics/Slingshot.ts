/**
 * Slangbellemekaniken. Spelaren drar bakåt och släpper; projektilen flyger (med vind/slice),
 * landar och rullar. Själva kastet sköts av Kastare (slingshot/launcher.ts); här finns banan,
 * poängen, hindren och resultatraden. Allt banspecifikt kommer från nivåfilen.
 *
 * Med sidovy och fysikblock (slingshot/blocks.ts) ska spelaren i stället slå ned block; nivån vinns
 * när "vinst"-villkoren gäller och förloras om skotten tar slut innan.
 * Bossnivåer: bossmätare och repliker (slingshot/boss.ts) och bogserläget (slingshot/tow.ts), där nivån
 * vinns genom att dra ett block över en gräns.
 */
import Phaser from 'phaser';
import type { FargNamn } from '../config/theme';
import { text } from '../config/strings';
import type { HinderObjekt, Niva, SlangbellaInstallningar } from '../core/levelTypes';
import type { Mekanik, MekanikKontext } from './Mechanic';
import { byggBana, iMal, type Bana } from './slingshot/course';
import { byggHud, byggRaknare, byggSkottko, byggVindindikator, type SlangbellaHud } from './slingshot/hud';
import { Fysikblock, type Block } from './slingshot/blocks';
import { byggInfotext } from './invaders/hud';
import { skapaText } from '../ui/text';
import { spelTips } from '../ui/TipPanel';
import { Boss } from './slingshot/boss';
import { Bogsering } from './slingshot/tow';
import { startaMusik, stoppaMusik } from '../core/sound';
import { BREDD } from '../config/display';
import { DJUP_KAST, Kastare, type KastSlut } from './slingshot/launcher';
import { slumpaVind } from './slingshot/flight';
import { ritaFigur } from './art';
import { pratbubbla } from '../ui/Badge';
import { spela } from '../core/sound';

/** Blocken ska ha legat stilla så här länge innan nästa skott (eller förlust); längre än så väntar vi aldrig. */
const BLOCK_STILLA_MS = 800;
const BLOCK_MAX_MS = 6000;

export class Slingshot implements Mekanik {
  private scene: Phaser.Scene;
  private niva: Niva;
  private inst: SlangbellaInstallningar;
  private bana: Bana;
  private hud?: SlangbellaHud;
  private kastare: Kastare;
  private block?: Fysikblock;
  private visaRaknare?: (kvar: number) => void;
  private visaSkottko?: (kvar: number) => void;
  /** Namngivna räknare (block med "raknas"), för stjarnkrav.minAntal/maxAntal. */
  private antal: Record<string, number> = {};
  private sistaPrassel = 0;
  private boss?: Boss;
  private bogsering?: Bogsering;
  /** Vilket skott (index i projektiler) som ligger i slangbellan, och om det redan fått ett svar. */
  private skottIndex = 0;
  private svarat = false;

  private kvar: number;
  private poang = 0;
  private skadestand = 0;
  private matarVarde = 100;
  private nollstallt = false;
  /** Om det pågående skottet har träffat ett hinder (då ger det inga poäng). */
  private traffatHinder = false;
  private klar = false;

  private landade: Phaser.GameObjects.Graphics;
  private visaVind?: (vind: { x: number; y: number }) => void;
  /** Vinden för det skott som laddas/flyger just nu (slumpas per skott om nivån har vind.variation). */
  private vind = { x: 0, y: 0 };

  constructor(private kontext: MekanikKontext) {
    this.scene = kontext.scene;
    this.niva = kontext.niva;
    if (!this.niva.slangbella) throw new Error(`Nivån "${this.niva.id}" saknar "slangbella"-inställningar`);
    this.inst = this.niva.slangbella;
    this.kvar = this.inst.antal;

    this.bana = byggBana(this.scene, this.niva);
    const { hud, vind, sidvy } = this.inst;
    if (hud) this.hud = byggHud(this.scene, { ...this.inst, hud });
    if (vind) this.visaVind = byggVindindikator(this.scene, vind);
    if (this.inst.infotext) byggInfotext(this.scene, this.inst.infotext, this.niva.tema ?? 'mork');
    if (sidvy) {
      this.scene.matter.world.setGravity(0, sidvy.gravitation);
      this.block = new Fysikblock(this.scene, this.niva, this.inst.nedLinje ?? sidvy.mark, sidvy.mark, (b) => this.blockNed(b));
    }
    if (this.inst.raknare) this.visaRaknare = byggRaknare(this.scene, this.inst.raknare);
    if (this.block && (this.inst.bossMatare || this.inst.svarFran)) this.boss = new Boss(this.scene, this.inst, this.block);
    if (this.block && this.inst.bogsera) {
      this.bogsering = new Bogsering(this.scene, this.inst.bogsera, this.block, {
        vidStart: () => this.bogseraStart(),
        vidVinst: () => this.bogseraVinst(),
        vidForlust: () => this.bogseraForlust(),
      });
    }
    if (this.inst.musik) startaMusik('boss');
    if (!hud) this.visaSkottko = byggSkottko(this.scene, this.bana.utslag, this.inst.projektil, this.inst.antal);
    if (this.inst.projektilNamn) {
      const { x, y } = this.bana.utslag;
      skapaText(this.scene, x, y + 74, this.inst.projektilNamn, 'rubrik', 'ljusbeige', { origo: [0.5, 0.5], storlek: 15 }).setDepth(DJUP_KAST.projektil);
    }

    // Kort tipsruta (bara tipset) i stället för den stora med uppdrag + tips.
    let tips = kontext.tips;
    if (this.inst.tipsUnderSpel) {
      kontext.tips.setVisible(false);
      // Med en knapp längst ner (bogserläget) står tipset ovanför knappen.
      const nedre = this.inst.bogsera?.knapp ? 16 + 52 + 12 : undefined;
      tips = spelTips(this.scene, this.niva.fylgiaTips, this.niva.tema ?? 'mork', nedre);
    }

    this.landade = this.scene.add.graphics().setDepth(DJUP_KAST.landad);
    this.kastare = new Kastare({
      scene: this.scene,
      niva: this.niva,
      inst: this.inst,
      utslag: this.bana.utslag,
      tips,
      kanSikta: () => !this.klar && this.kvar > 0 && !this.bogsering?.igang,
      utseende: () => this.inst.projektiler?.[this.skottIndex]?.utseende ?? this.inst.projektil,
      etikett: this.inst.projektiler ? () => this.inst.projektiler?.[this.skottIndex]?.etikett : undefined,
      vind: () => this.vind,
      markfriktion: (x, y) => this.bana.mal.find((m) => iMal(m, x, y))?.friktion ?? this.inst.friktion.mark,
      vidSkott: () => {
        this.traffatHinder = false;
        this.svarat = false;
        this.kvar -= 1;
        this.uppdateraHud();
      },
      vidKollision: (_k, annan) => {
        if (this.block?.arBlock(annan)) this.traffaBlock(annan);
        const svarar = this.inst.svarFran ? this.block?.hamta(this.inst.svarFran) : undefined;
        if (svarar && svarar.kropp === annan && !this.svarat) this.svara();
        const hinder = this.bana.hinder.get(annan.id);
        if (hinder && !this.traffatHinder) this.traffaHinder(hinder);
      },
      vidSlut: (_k, x, y, orsak) => this.avslutaSkott(x, y, orsak),
    });

    this.uppdateraHud();
    this.laddaNasta();
    if (this.inst.bogsera?.aktivering === 'direkt') this.bogsering?.starta();
  }

  pausa(pausad: boolean): void {
    this.kastare.pausa(pausad);
    this.bogsering?.pausa(pausad);
    if (!this.inst.musik) return;
    if (pausad || this.klar) stoppaMusik();
    else startaMusik(this.bogsering?.igang ? 'boss-ljus' : 'boss');
  }

  forstor(): void {
    stoppaMusik();
    this.kastare.forstor();
    this.block?.forstor();
    this.bogsering?.forstor();
  }

  // ---------- Boss och bogsering ----------

  /** Skottet träffade blocket som svarar: mätaren blinkar och bossen svarar; efter sista skottet en slutreplik. */
  private svara(): void {
    this.svarat = true;
    this.boss?.blinka();
    const svar = this.inst.projektiler?.[this.skottIndex]?.svar;
    if (svar) this.boss?.replik(svar);
    const slut = this.inst.slutreplik;
    if (this.kvar === 0 && slut) this.scene.time.delayedCall(2800, () => !this.klar && !this.bogsering?.igang && this.boss?.replik(slut));
    this.kollaPuls();
  }

  /** Bogserknappen börjar pulsera när tillräckligt många skott är använda. */
  private kollaPuls(): void {
    const efter = this.inst.bogsera?.knapp?.pulseraEfterSkott;
    if (efter !== undefined && this.inst.antal - this.kvar >= efter) this.bogsering?.pulsera();
  }

  private bogseraStart(): void {
    this.kastare.dolj();
    this.visaSkottko?.(0);
    if (this.inst.musik) startaMusik('boss-ljus');
  }

  private bogseraVinst(): void {
    this.klar = true;
    const b = this.inst.bogsera!;
    const id = b.objekt;
    (b.vinst.utseenden ?? []).forEach((u, i) => this.scene.time.delayedCall(i * 700, () => this.block?.bytUtseende(id, u)));
    spela('traff');
    const last = this.block?.hamta(id);
    const x = Phaser.Math.Clamp(last?.kropp.position.x ?? BREDD / 2, 130, BREDD - 130);
    const y = (last?.kropp.position.y ?? 300) - (last?.data.h ?? 0) / 2 - 40;
    const t = skapaText(this.scene, x, y, b.vinst.text, 'rubrik', 'ljusbeige', { origo: [0.5, 0.5], storlek: 22 }).setDepth(30).setAlpha(0);
    this.scene.tweens.add({ targets: t, alpha: 1, duration: 250, delay: 400 });
    this.scene.time.delayedCall(2600, () => {
      stoppaMusik();
      this.kontext.avsluta({ poang: 0, skadestand: 0, nollstallt: false, forsok: this.inst.antal - this.kvar });
    });
  }

  private bogseraForlust(): void {
    this.klar = true;
    stoppaMusik();
    this.kontext.avsluta({ poang: 0, skadestand: 0, nollstallt: true, forsok: this.inst.antal - this.kvar, forlust: 'tid-slut' });
  }

  // ---------- Fysikblock ----------

  /** Projektilen träffar ett block: väck hela tornet, prassla om det är papper. */
  private traffaBlock(kropp: MatterJS.BodyType): void {
    this.block?.vackAlla();
    const nu = this.scene.time.now;
    if (this.block?.arPapper(kropp) && nu - this.sistaPrassel > 150) {
      this.sistaPrassel = nu;
      spela('prassel');
    }
  }

  private blockNed(b: Block): void {
    if (b.data.raknas) this.antal[b.data.raknas] = (this.antal[b.data.raknas] ?? 0) + 1;
    if (b.data.mal) this.visaRaknare?.(this.block?.malKvar() ?? 0);
    if (b.data.nedText) {
      const { x, y } = b.kropp.position;
      this.popup(Phaser.Math.Clamp(x, 110, BREDD - 110), Phaser.Math.Clamp(y - 40, 220, 600), b.data.nedText, 'guld', 'morkgron');
    }
  }

  private vinstUppfylld(): boolean {
    const block = this.block;
    if (!block || !this.inst.vinst) return false;
    return this.inst.vinst.every((v) => (v === 'alla-block' ? block.malKvar() === 0 : v.startsWith('block:') ? block.arNed(v.slice(6)) : false));
  }

  /**
   * Efter ett skott i en blocknivå: vinst avgörs så fort villkoren gäller. Annars väntar vi tills blocken
   * legat stilla en stund (eller högst BLOCK_MAX_MS), och laddar sedan nästa skott eller ger förlust.
   */
  private efterBlockskott(vantat = 0, stilla = 0): void {
    if (this.klar) return;
    const resultat = { poang: 0, skadestand: 0, forsok: this.inst.antal - this.kvar, antal: this.antal };
    const klart = this.vinstUppfylld();
    stilla = this.block?.iVila() ? stilla + 200 : 0;
    if (!klart && stilla < BLOCK_STILLA_MS && vantat < BLOCK_MAX_MS) {
      this.scene.time.delayedCall(200, () => this.efterBlockskott(vantat + 200, stilla));
      return;
    }
    if (klart) {
      this.klar = true;
      this.scene.time.delayedCall(500, () => this.kontext.avsluta({ ...resultat, nollstallt: false }));
    } else if (this.kvar > 0) {
      this.laddaNasta();
    } else {
      this.klar = true;
      this.kontext.avsluta({ ...resultat, nollstallt: true, forlust: 'skott-slut' });
    }
  }

  private traffaHinder(hinder: HinderObjekt): void {
    this.traffatHinder = true;
    this.skadestand += hinder.skadestand;
    this.matarVarde = Math.max(0, this.matarVarde + hinder.matare);
    this.poang += hinder.poang ?? 0;
    if (hinder.nollstallerStjarnor) this.nollstallt = true;
    this.uppdateraHud();
    this.scene.cameras.main.shake(140, 0.004);
    spela('misstag');
    this.popup(hinder.x, hinder.y - hinder.h, hinder.traffText, 'vinrod', 'ljusbeige');
  }

  private avslutaSkott(x: number, y: number, orsak: KastSlut): void {
    if (this.inst.bogsera) {
      // Bossnivå: skotten avgör inget; nästa laddas, och när de är slut väntar bogserläget.
      this.kollaPuls();
      this.scene.time.delayedCall(900, () => {
        if (this.klar || this.bogsering?.igang) return;
        if (this.kvar > 0) this.laddaNasta();
        else if (this.inst.bogsera?.aktivering === 'efter-skott') this.bogsering?.starta();
      });
      return;
    }
    if (this.inst.vinst) {
      this.scene.time.delayedCall(400, () => this.efterBlockskott());
      return;
    }
    if (orsak === 'stannat') {
      ritaFigur(this.landade, this.inst.projektil, x, y);
      const mal = this.bana.mal.find((m) => iMal(m, x, y));
      if (mal && !this.traffatHinder) {
        this.poang += mal.poang ?? 0;
        spela('traff');
        this.popup(x, y - 26, mal.traffText, 'guld', 'morkgron');
      } else if (!this.traffatHinder) {
        this.popup(x, y - 26, text.niva.miss, 'ljusbeige', 'morkgron');
      }
    } else if (!this.traffatHinder) {
      this.popup(Phaser.Math.Clamp(x, 60, 330), Phaser.Math.Clamp(y, 200, 600), text.niva.ute, 'vinrod', 'ljusbeige');
    }

    this.scene.time.delayedCall(900, () => {
      if (this.kvar > 0) this.laddaNasta();
      else this.avslutaNiva();
    });
  }

  private laddaNasta(): void {
    if (this.inst.vind) {
      this.vind = slumpaVind(this.inst.vind);
      this.visaVind?.(this.vind);
    }
    this.skottIndex = this.inst.antal - this.kvar;
    this.visaSkottko?.(this.kvar);
    this.kastare.laddaNasta();
  }

  private avslutaNiva(): void {
    if (this.klar) return;
    this.klar = true;
    this.kontext.avsluta({ poang: this.poang, skadestand: this.skadestand, nollstallt: this.nollstallt });
  }

  // ---------- Grafik ----------

  private uppdateraHud(): void {
    this.visaRaknare?.(this.block?.malKvar() ?? 0);
    if (!this.hud) return;
    this.hud.visaMatare(this.matarVarde);
    this.hud.visaKvar(this.kvar);
    this.hud.visaKostnad(this.skadestand);
  }

  private popup(x: number, y: number, innehall: string, bakgrund: FargNamn, textFarg: FargNamn): void {
    const p = pratbubbla(this.scene, x, y, innehall, bakgrund, textFarg).setDepth(DJUP_KAST.popup).setScale(0.6);
    this.scene.tweens.add({ targets: p, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: p, y: y - 18, alpha: 0, delay: 1100, duration: 400, onComplete: () => p.destroy() });
  }
}
