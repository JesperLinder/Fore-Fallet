/**
 * Slangbellemekaniken. Spelaren drar bakåt och släpper; projektilen flyger (med vind/slice),
 * landar och rullar. Själva kastet sköts av Kastare (slingshot/launcher.ts); här finns banan,
 * poängen, hindren och resultatraden. Allt banspecifikt kommer från nivåfilen.
 */
import Phaser from 'phaser';
import type { FargNamn } from '../config/theme';
import { text } from '../config/strings';
import type { HinderObjekt, Niva, SlangbellaInstallningar } from '../core/levelTypes';
import type { Mekanik, MekanikKontext } from './Mechanic';
import { byggBana, iMal, type Bana } from './slingshot/course';
import { byggHud, byggVindindikator, type SlangbellaHud } from './slingshot/hud';
import { DJUP_KAST, Kastare, type KastSlut } from './slingshot/launcher';
import { ritaFigur } from './art';
import { pratbubbla } from '../ui/Badge';
import { spela } from '../core/sound';

export class Slingshot implements Mekanik {
  private scene: Phaser.Scene;
  private niva: Niva;
  private inst: SlangbellaInstallningar;
  private bana: Bana;
  private hud: SlangbellaHud;
  private kastare: Kastare;

  private kvar: number;
  private poang = 0;
  private skadestand = 0;
  private matarVarde = 100;
  private nollstallt = false;
  /** Om det pågående skottet har träffat ett hinder (då ger det inga poäng). */
  private traffatHinder = false;
  private klar = false;

  private landade: Phaser.GameObjects.Graphics;
  private visaVind: (vind: { x: number; y: number }) => void;
  /** Vinden för det skott som laddas/flyger just nu (slumpas per skott om nivån har vind.variation). */
  private vind = { x: 0, y: 0 };

  constructor(private kontext: MekanikKontext) {
    this.scene = kontext.scene;
    this.niva = kontext.niva;
    if (!this.niva.slangbella) throw new Error(`Nivån "${this.niva.id}" saknar "slangbella"-inställningar`);
    this.inst = this.niva.slangbella;
    this.kvar = this.inst.antal;

    this.bana = byggBana(this.scene, this.niva);
    this.hud = byggHud(this.scene, this.inst);
    this.visaVind = byggVindindikator(this.scene, this.inst);

    this.landade = this.scene.add.graphics().setDepth(DJUP_KAST.landad);
    this.kastare = new Kastare({
      scene: this.scene,
      niva: this.niva,
      inst: this.inst,
      utslag: this.bana.utslag,
      tips: kontext.tips,
      kanSikta: () => !this.klar && this.kvar > 0,
      utseende: () => this.inst.projektil,
      vind: () => this.vind,
      markfriktion: (x, y) => this.bana.mal.find((m) => iMal(m, x, y))?.friktion ?? this.inst.friktion.mark,
      vidSkott: () => {
        this.traffatHinder = false;
        this.kvar -= 1;
        this.uppdateraHud();
      },
      vidKollision: (_k, annan) => {
        const hinder = this.bana.hinder.get(annan.id);
        if (hinder && !this.traffatHinder) this.traffaHinder(hinder);
      },
      vidSlut: (_k, x, y, orsak) => this.avslutaSkott(x, y, orsak),
    });

    this.uppdateraHud();
    this.laddaNasta();
  }

  pausa(pausad: boolean): void {
    this.kastare.pausa(pausad);
  }

  forstor(): void {
    this.kastare.forstor();
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
    this.vind = this.slumpaVind();
    this.visaVind(this.vind);
    this.kastare.laddaNasta();
  }

  /** Vinden inför nästa skott: fast, eller slumpad inom nivåns vind.variation. */
  private slumpaVind(): { x: number; y: number } {
    const v = this.inst.vind;
    if (!v.variation) return { x: v.x, y: v.y };
    const styrka = Phaser.Math.FloatBetween(v.variation.min, v.variation.max);
    const motsatt = Math.random() < (v.variation.motsattChans ?? 0);
    return { x: Math.sign(v.x || 1) * styrka * (motsatt ? -1 : 1), y: v.y };
  }

  private avslutaNiva(): void {
    if (this.klar) return;
    this.klar = true;
    this.kontext.avsluta({ poang: this.poang, skadestand: this.skadestand, nollstallt: this.nollstallt });
  }

  // ---------- Grafik ----------

  private uppdateraHud(): void {
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
