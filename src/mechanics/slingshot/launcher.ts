/**
 * Kastaren: själva slangbellan, delad mellan slangbellenivåer och hybridnivåer.
 * Sköter dra-och-släpp, siktlinje, Matter-kroppen, flygning (vind, friktion), skugga och spår,
 * och meddelar mekaniken via återanrop när ett kast är klart. Två lägen: uppifrån (standard, egen
 * flygmodell med höjd och landning) och sidovy (inst.sidvy: Matter sköter gravitation och studsar). Vad som händer vid landning,
 * poäng och hinder bestämmer mekaniken som använder den.
 */
import Phaser from 'phaser';
import { farg, type FargNamn } from '../../config/theme';
import type { KastInstallningar, Niva } from '../../core/levelTypes';
import { spela } from '../../core/sound';
import { ritaFigur } from '../art';
import { antalFlygsteg, forhandsvisning, forhandsvisningSida, hojd, nastaHastighet } from './flight';

export type MatterKropp = MatterJS.BodyType;
export type KastSlut = 'ute' | 'stannat';

const MIN_DRAG = 14;
const STOPPFART = 0.08;
const MAX_STEG = 900;
/** Sidovy: kastet är slut när projektilen varit långsammare än så här i så många steg i rad, eller efter MAX_STEG_SIDA. */
const VILA_FART = 0.25;
const VILA_STEG = 30;
const MAX_STEG_SIDA = 420;
export const DJUP_KAST = { landad: 2, bage: 3, band: 4, skugga: 4, projektil: 5, sikte: 6, popup: 20 };

export interface Kast {
  kropp: MatterKropp;
  steg: number;
  flygsteg: number;
  styrka: number;
  /** Sidovy: antal steg i rad som projektilen varit nästan stilla. */
  stilla?: number;
}

export interface KastareVal {
  scene: Phaser.Scene;
  niva: Niva;
  inst: KastInstallningar;
  utslag: { x: number; y: number };
  /** Tonas ner medan spelaren siktar (t.ex. tipsrutan). */
  tips?: Phaser.GameObjects.Container;
  /** Får spelaren börja sikta just nu? (paus, slut, inga skott kvar …) */
  kanSikta: () => boolean;
  /** Figur ur art.ts för projektilen just nu. */
  utseende: () => string;
  /** Sidvind för det aktuella kastet. */
  vind: () => { x: number; y: number };
  /** Bromsning när projektilen rullar på marken vid (x, y). */
  markfriktion: (x: number, y: number) => number;
  vidSkott?: (kast: Kast) => void;
  /** Kallas efter varje fysiksteg medan kastet pågår (t.ex. för att studsa mot en yta). */
  vidSteg?: (kast: Kast) => void;
  vidKollision?: (kast: Kast, annan: MatterKropp) => void;
  /** Kastet är klart: projektilen har stannat eller lämnat spelplanen. Kroppen är redan borttagen. */
  vidSlut: (kast: Kast, x: number, y: number, orsak: KastSlut) => void;
}

export class Kastare {
  private scene: Phaser.Scene;
  private siktar = false;
  private pausad = false;
  private dragStart = new Phaser.Math.Vector2();
  private drag = new Phaser.Math.Vector2();
  private kast: Kast | null = null;

  private projektil: Phaser.GameObjects.Graphics;
  private skugga: Phaser.GameObjects.Graphics;
  private band: Phaser.GameObjects.Graphics;
  private sikte: Phaser.GameObjects.Graphics;
  /** Guldprickar efter senaste kastet. Ligger kvar tills nästa kast. */
  private spar: Phaser.GameObjects.Graphics;

  constructor(private val: KastareVal) {
    this.scene = val.scene;
    this.spar = this.scene.add.graphics().setDepth(DJUP_KAST.landad);
    this.ritaSlangbella();
    this.band = this.scene.add.graphics().setDepth(DJUP_KAST.band);
    this.skugga = this.scene.add.graphics().setDepth(DJUP_KAST.skugga);
    this.projektil = this.scene.add.graphics().setDepth(DJUP_KAST.projektil);
    this.ritaProjektil();
    this.sikte = this.scene.add.graphics().setDepth(DJUP_KAST.sikte);
    this.kopplaInput();
    this.kopplaFysik();
  }

  /** Sant medan ett kast flyger eller rullar. */
  get flyger(): boolean {
    return this.kast !== null;
  }

  /** Lägger en ny projektil i slangbellan. */
  laddaNasta(): void {
    const { x, y } = this.val.utslag;
    this.ritaProjektil();
    this.projektil.setPosition(x, y).setScale(0).setVisible(true);
    this.scene.tweens.add({ targets: this.projektil, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.ritaBand(x, y);
  }

  /** Ritar om projektilen, t.ex. när spelaren byter vad som ska kastas. */
  ritaProjektil(): void {
    this.projektil.clear();
    ritaFigur(this.projektil, this.val.utseende(), 0, 0);
  }

  /** Döljer projektilen i slangbellan (t.ex. medan något annat händer). */
  dolj(): void {
    this.projektil.setVisible(false);
  }

  pausa(pausad: boolean): void {
    this.pausad = pausad;
    if (pausad) this.avbrytSikte();
  }

  forstor(): void {
    this.scene.input.removeAllListeners();
    // Fysikvärlden kan redan vara nedriven när scenen stängs.
    const varld = this.scene.matter.world as Phaser.Physics.Matter.World | null;
    varld?.off('beforeupdate').off('afterupdate').off('collisionstart');
  }

  // ---------- Sikte ----------

  private kopplaInput(): void {
    const input = this.scene.input;
    input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => {
      if (this.pausad || this.kast || !this.val.kanSikta() || over.length > 0) return;
      this.siktar = true;
      this.dragStart.copy(this.scene.cameras.main.getWorldPoint(p.x, p.y));
      this.drag.set(0, 0);
      if (this.val.tips) this.scene.tweens.add({ targets: this.val.tips, alpha: 0.15, duration: 150 });
    });
    input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.siktar) return;
      const punkt = this.scene.cameras.main.getWorldPoint(p.x, p.y);
      this.drag.set(punkt.x - this.dragStart.x, punkt.y - this.dragStart.y).limit(this.val.inst.maxDrag);
      this.ritaSikte();
    });
    input.on('pointerup', () => {
      if (!this.siktar) return;
      const drag = this.drag.clone();
      this.avbrytSikte();
      if (drag.length() >= MIN_DRAG) this.skjut(drag);
    });
  }

  private avbrytSikte(): void {
    this.siktar = false;
    this.drag.set(0, 0);
    this.sikte.clear();
    this.ritaBand(this.val.utslag.x, this.val.utslag.y);
    if (!this.kast) this.projektil.setPosition(this.val.utslag.x, this.val.utslag.y);
    if (this.val.tips) this.scene.tweens.add({ targets: this.val.tips, alpha: 1, duration: 200 });
  }

  private ritaSikte(): void {
    const { x, y } = this.val.utslag;
    const inst = this.val.inst;
    this.projektil.setPosition(x + this.drag.x, y + this.drag.y);
    this.ritaBand(x + this.drag.x, y + this.drag.y);

    this.sikte.clear();
    if (this.drag.length() < MIN_DRAG) return;
    const styrka = this.drag.length() / inst.maxDrag;
    const v0 = { vx: -this.drag.x * inst.kraft, vy: -this.drag.y * inst.kraft };
    const hela = inst.sidvy ? forhandsvisningSida(x, y, v0, inst) : forhandsvisning(x, y, v0, inst, styrka);
    // Nivån kan korta siktlinjen så att man inte ser var projektilen landar.
    const andel = Phaser.Math.Clamp(inst.siktlinje ?? 1, 0.05, 1);
    const punkter = hela.slice(0, Math.max(1, Math.ceil(hela.length * andel)));
    punkter.forEach((p, i) => {
      const sist = andel >= 1 && i === punkter.length - 1;
      this.sikte.fillStyle(this.kontrastFarg(p.y), 1);
      if (sist) this.sikte.lineStyle(1.5, this.kontrastFarg(p.y), 1).strokeCircle(p.x, p.y, 6);
      else this.sikte.fillCircle(p.x, p.y, 1.8);
    });
  }

  /** Väljer ljus eller mörk prick beroende på vilket banlager punkten ligger i. */
  private kontrastFarg(y: number): number {
    const lager = [...this.val.niva.bana.lager].reverse().find((l) => y >= l.topp);
    const ljusa: FargNamn[] = ['ljusbeige', 'beige', 'lila'];
    return lager && ljusa.includes(lager.farg) ? farg.morkgron : farg.ljusbeige;
  }

  // ---------- Kast och fysik ----------

  private skjut(drag: Phaser.Math.Vector2): void {
    spela('skott');
    const { x, y } = this.val.utslag;
    const inst = this.val.inst;
    const styrka = drag.length() / inst.maxDrag;
    if (inst.sidvy) {
      // Sidovy: en vanlig kropp som Matter flyttar (gravitation, luftmotstånd, studs).
      const kropp = this.scene.matter.add.circle(x, y, inst.sidvy.radie ?? 10, {
        label: 'projektil',
        density: inst.sidvy.vikt ?? 0.004,
        restitution: 0.3,
        friction: 0.4,
        frictionAir: inst.friktion.luft,
      });
      this.scene.matter.body.setVelocity(kropp, { x: -drag.x * inst.kraft, y: -drag.y * inst.kraft });
      this.kast = { kropp, steg: 0, flygsteg: 0, styrka, stilla: 0 };
      this.spar.clear();
      this.val.vidSkott?.(this.kast);
      return;
    }
    const kropp = this.scene.matter.add.circle(x, y, 7, {
      label: 'projektil',
      restitution: 0.5,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
    });
    this.scene.matter.body.setVelocity(kropp, { x: -drag.x * inst.kraft, y: -drag.y * inst.kraft });
    this.kast = { kropp, steg: 0, flygsteg: antalFlygsteg(inst, styrka), styrka };
    this.spar.clear();
    this.val.vidSkott?.(this.kast);
  }

  private kopplaFysik(): void {
    const varld = this.scene.matter.world;

    // Före varje steg: vind i luften, friktion på marken.
    varld.on('beforeupdate', () => {
      const k = this.kast;
      if (!k) return;
      k.steg += 1;
      if (this.val.inst.sidvy) return; // sidovy: Matter sköter rörelsen
      const iLuften = k.steg <= k.flygsteg;
      const { x, y } = k.kropp.position;
      const markfriktion = this.val.markfriktion(x, y);
      const v = nastaHastighet({ vx: k.kropp.velocity.x, vy: k.kropp.velocity.y }, iLuften, this.val.inst, markfriktion, true, this.val.vind());
      this.scene.matter.body.setVelocity(k.kropp, { x: v.vx, y: v.vy });
    });

    // Efter varje steg: rita och kolla om kastet är över.
    varld.on('afterupdate', () => {
      const k = this.kast;
      if (!k) return;
      const { x, y } = k.kropp.position;
      this.ritaFlygning(k, x, y);
      this.val.vidSteg?.(k);
      if (this.kast !== k) return; // vidSteg kan ha avslutat kastet
      const fart = Math.hypot(k.kropp.velocity.x, k.kropp.velocity.y);
      const plan = this.val.inst.spelplan;
      if (this.val.inst.sidvy) {
        // Över skärmen är tillåtet (bågen kan gå högt); ute är bara åt sidorna och nedåt.
        const uteSida = x < plan.x - 20 || x > plan.x + plan.b + 20 || y > plan.y + plan.h;
        k.stilla = fart < VILA_FART ? (k.stilla ?? 0) + 1 : 0;
        if (uteSida) this.avsluta(k, 'ute');
        else if (k.stilla >= VILA_STEG || k.steg > MAX_STEG_SIDA) this.avsluta(k, 'stannat');
        return;
      }
      const ute = x < plan.x || x > plan.x + plan.b || y < plan.y || y > plan.y + plan.h;
      if (ute) this.avsluta(k, 'ute');
      else if ((k.steg > k.flygsteg && fart < STOPPFART) || k.steg > MAX_STEG) this.avsluta(k, 'stannat');
    });

    varld.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      const k = this.kast;
      if (!k) return;
      for (const par of event.pairs) {
        const annan = par.bodyA === k.kropp ? par.bodyB : par.bodyB === k.kropp ? par.bodyA : null;
        if (annan) this.val.vidKollision?.(k, annan);
      }
    });
  }

  private ritaFlygning(k: Kast, x: number, y: number): void {
    if (this.val.inst.sidvy) {
      this.projektil.setPosition(x, y).setRotation(k.kropp.angle);
      if (k.steg % 4 === 0) this.spar.fillStyle(farg.guld, 1).fillCircle(x, y, 1.4);
      return;
    }
    const h = hojd(k.steg, k.flygsteg, k.styrka);
    this.projektil.setPosition(x, y - h).setScale(1 + h / 70);
    this.skugga.clear();
    if (h > 0) this.skugga.fillStyle(farg.morkgron, 0.35).fillEllipse(x, y + 4, 12, 5);
    if (k.steg % 4 === 0) this.spar.fillStyle(farg.guld, 1).fillCircle(x, y - h, 1.4);
  }

  /** Avslutar kastet: tar bort kroppen, döljer projektilen och meddelar mekaniken. */
  avsluta(k: Kast, orsak: KastSlut): void {
    const { x, y } = k.kropp.position;
    this.scene.matter.world.remove(k.kropp);
    this.kast = null;
    this.skugga.clear();
    this.projektil.setScale(1).setRotation(0).setVisible(false);
    this.val.vidSlut(k, x, y, orsak);
  }

  // ---------- Grafik ----------

  private ritaSlangbella(): void {
    const { x, y } = this.val.utslag;
    const g = this.scene.add.graphics().setDepth(DJUP_KAST.bage);
    g.lineStyle(5, farg.beige, 1);
    g.lineBetween(x - 30, y + 60, x - 21, y - 18);
    g.lineBetween(x + 30, y + 60, x + 21, y - 18);
    g.fillStyle(farg.lila, 1).fillCircle(x - 21, y - 18, 4).fillCircle(x + 21, y - 18, 4);
  }

  private ritaBand(px: number, py: number): void {
    const { x, y } = this.val.utslag;
    this.band.clear().lineStyle(2, farg.lila, 1);
    this.band.lineBetween(x - 21, y - 18, px, py);
    this.band.lineBetween(x + 21, y - 18, px, py);
  }
}
