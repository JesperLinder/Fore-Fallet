/**
 * Slangbellemekaniken. Spelaren drar bakåt och släpper; projektilen flyger (med vind/slice),
 * landar och rullar. Matter.js sköter rörelse och kollisioner med hinder.
 * Allt banspecifikt (mål, hinder, vind, antal skott) kommer från nivåfilen.
 */
import Phaser from 'phaser';
import { farg, type FargNamn } from '../config/theme';
import { text } from '../config/strings';
import type { HinderObjekt, Niva, SlangbellaInstallningar } from '../core/levelTypes';
import type { Mekanik, MekanikKontext } from './Mechanic';
import { byggBana, iMal, type Bana } from './slingshot/course';
import { byggHud, byggVindindikator, type SlangbellaHud } from './slingshot/hud';
import { antalFlygsteg, forhandsvisning, hojd, nastaHastighet } from './slingshot/flight';
import { ritaFigur } from './art';
import { pratbubbla } from '../ui/Badge';
import { spela } from '../core/sound';

type MatterKropp = MatterJS.BodyType;

const MIN_DRAG = 14;
const STOPPFART = 0.08;
const MAX_STEG = 900;
const DJUP = { landad: 2, bage: 3, band: 4, skugga: 4, projektil: 5, sikte: 6, popup: 20 };

interface Skott {
  kropp: MatterKropp;
  steg: number;
  flygsteg: number;
  styrka: number;
  traffatHinder: boolean;
}

export class Slingshot implements Mekanik {
  private scene: Phaser.Scene;
  private niva: Niva;
  private inst: SlangbellaInstallningar;
  private bana: Bana;
  private hud: SlangbellaHud;

  private kvar: number;
  private poang = 0;
  private skadestand = 0;
  private matarVarde = 100;
  private nollstallt = false;

  private siktar = false;
  private dragStart = new Phaser.Math.Vector2();
  private drag = new Phaser.Math.Vector2();
  private skott: Skott | null = null;
  private pausad = false;
  private klar = false;

  private projektil: Phaser.GameObjects.Graphics;
  private skugga: Phaser.GameObjects.Graphics;
  private band: Phaser.GameObjects.Graphics;
  private sikte: Phaser.GameObjects.Graphics;
  private landade: Phaser.GameObjects.Graphics;
  private spar: Phaser.GameObjects.Graphics;

  constructor(private kontext: MekanikKontext) {
    this.scene = kontext.scene;
    this.niva = kontext.niva;
    if (!this.niva.slangbella) throw new Error(`Nivån "${this.niva.id}" saknar "slangbella"-inställningar`);
    this.inst = this.niva.slangbella;
    this.kvar = this.inst.antal;

    this.bana = byggBana(this.scene, this.niva);
    this.hud = byggHud(this.scene, this.inst);
    byggVindindikator(this.scene, this.inst);

    this.landade = this.scene.add.graphics().setDepth(DJUP.landad);
    this.spar = this.scene.add.graphics().setDepth(DJUP.landad);
    this.ritaSlangbella();
    this.band = this.scene.add.graphics().setDepth(DJUP.band);
    this.skugga = this.scene.add.graphics().setDepth(DJUP.skugga);
    this.projektil = this.scene.add.graphics().setDepth(DJUP.projektil);
    ritaFigur(this.projektil, this.inst.projektil, 0, 0);
    this.sikte = this.scene.add.graphics().setDepth(DJUP.sikte);

    this.uppdateraHud();
    this.laddaNasta();
    this.kopplaInput();
    this.kopplaFysik();
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
      if (this.pausad || this.skott || this.klar || this.kvar <= 0 || over.length > 0) return;
      this.siktar = true;
      this.dragStart.copy(this.scene.cameras.main.getWorldPoint(p.x, p.y));
      this.drag.set(0, 0);
      this.scene.tweens.add({ targets: this.kontext.tips, alpha: 0.15, duration: 150 });
    });
    input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.siktar) return;
      const punkt = this.scene.cameras.main.getWorldPoint(p.x, p.y);
      this.drag.set(punkt.x - this.dragStart.x, punkt.y - this.dragStart.y).limit(this.inst.maxDrag);
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
    this.ritaBand(this.bana.utslag.x, this.bana.utslag.y);
    if (!this.skott) this.projektil.setPosition(this.bana.utslag.x, this.bana.utslag.y);
    this.scene.tweens.add({ targets: this.kontext.tips, alpha: 1, duration: 200 });
  }

  private ritaSikte(): void {
    const { x, y } = this.bana.utslag;
    this.projektil.setPosition(x + this.drag.x, y + this.drag.y);
    this.ritaBand(x + this.drag.x, y + this.drag.y);

    this.sikte.clear();
    if (this.drag.length() < MIN_DRAG) return;
    const styrka = this.drag.length() / this.inst.maxDrag;
    const v0 = { vx: -this.drag.x * this.inst.kraft, vy: -this.drag.y * this.inst.kraft };
    const punkter = forhandsvisning(x, y, v0, this.inst, styrka);
    punkter.forEach((p, i) => {
      const sist = i === punkter.length - 1;
      this.sikte.fillStyle(this.kontrastFarg(p.y), 1);
      if (sist) this.sikte.lineStyle(1.5, this.kontrastFarg(p.y), 1).strokeCircle(p.x, p.y, 6);
      else this.sikte.fillCircle(p.x, p.y, 1.8);
    });
  }

  /** Väljer ljus eller mörk prick beroende på vilket banlager punkten ligger i. */
  private kontrastFarg(y: number): number {
    const lager = [...this.niva.bana.lager].reverse().find((l) => y >= l.topp);
    const ljusa: FargNamn[] = ['ljusbeige', 'beige', 'lila'];
    return lager && ljusa.includes(lager.farg) ? farg.morkgron : farg.ljusbeige;
  }

  // ---------- Skott och fysik ----------

  private skjut(drag: Phaser.Math.Vector2): void {
    spela('skott');
    const { x, y } = this.bana.utslag;
    const styrka = drag.length() / this.inst.maxDrag;
    const kropp = this.scene.matter.add.circle(x, y, 7, {
      label: 'projektil',
      restitution: 0.5,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
    });
    this.scene.matter.body.setVelocity(kropp, { x: -drag.x * this.inst.kraft, y: -drag.y * this.inst.kraft });
    this.skott = { kropp, steg: 0, flygsteg: antalFlygsteg(this.inst, styrka), styrka, traffatHinder: false };
    this.kvar -= 1;
    this.spar.clear();
    this.uppdateraHud();
  }

  private kopplaFysik(): void {
    const varld = this.scene.matter.world;

    // Före varje steg: vind i luften, friktion på marken.
    varld.on('beforeupdate', () => {
      const s = this.skott;
      if (!s) return;
      s.steg += 1;
      const iLuften = s.steg <= s.flygsteg;
      const { x, y } = s.kropp.position;
      const mal = this.bana.mal.find((m) => iMal(m, x, y));
      const markfriktion = mal?.friktion ?? this.inst.friktion.mark;
      const v = nastaHastighet({ vx: s.kropp.velocity.x, vy: s.kropp.velocity.y }, iLuften, this.inst, markfriktion);
      this.scene.matter.body.setVelocity(s.kropp, { x: v.vx, y: v.vy });
    });

    // Efter varje steg: rita och kolla om skottet är över.
    varld.on('afterupdate', () => {
      const s = this.skott;
      if (!s) return;
      const { x, y } = s.kropp.position;
      this.ritaFlygning(s, x, y);
      const fart = Math.hypot(s.kropp.velocity.x, s.kropp.velocity.y);
      const plan = this.inst.spelplan;
      const ute = x < plan.x || x > plan.x + plan.b || y < plan.y || y > plan.y + plan.h;
      if (ute) this.avslutaSkott(s, 'ute');
      else if ((s.steg > s.flygsteg && fart < STOPPFART) || s.steg > MAX_STEG) this.avslutaSkott(s, 'stannat');
    });

    varld.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      const s = this.skott;
      if (!s) return;
      for (const par of event.pairs) {
        const annan = par.bodyA === s.kropp ? par.bodyB : par.bodyB === s.kropp ? par.bodyA : null;
        const hinder = annan ? this.bana.hinder.get(annan.id) : undefined;
        if (hinder && !s.traffatHinder) this.traffaHinder(s, hinder);
      }
    });
  }

  private ritaFlygning(s: Skott, x: number, y: number): void {
    const h = hojd(s.steg, s.flygsteg, s.styrka);
    this.projektil.setPosition(x, y - h).setScale(1 + h / 70);
    this.skugga.clear();
    if (h > 0) this.skugga.fillStyle(farg.morkgron, 0.35).fillEllipse(x, y + 4, 12, 5);
    if (s.steg % 4 === 0) this.spar.fillStyle(farg.guld, 1).fillCircle(x, y - h, 1.4);
  }

  private traffaHinder(s: Skott, hinder: HinderObjekt): void {
    s.traffatHinder = true;
    this.skadestand += hinder.skadestand;
    this.matarVarde = Math.max(0, this.matarVarde + hinder.matare);
    this.poang += hinder.poang ?? 0;
    if (hinder.nollstallerStjarnor) this.nollstallt = true;
    this.uppdateraHud();
    this.scene.cameras.main.shake(140, 0.004);
    spela('misstag');
    this.popup(hinder.x, hinder.y - hinder.h, hinder.traffText, 'vinrod', 'ljusbeige');
  }

  private avslutaSkott(s: Skott, orsak: 'ute' | 'stannat'): void {
    const { x, y } = s.kropp.position;
    this.scene.matter.world.remove(s.kropp);
    this.skott = null;
    this.skugga.clear();
    this.projektil.setScale(1).setVisible(false);

    if (orsak === 'stannat') {
      ritaFigur(this.landade, this.inst.projektil, x, y);
      const mal = this.bana.mal.find((m) => iMal(m, x, y));
      if (mal && !s.traffatHinder) {
        this.poang += mal.poang ?? 0;
        spela('traff');
        this.popup(x, y - 26, mal.traffText, 'guld', 'morkgron');
      } else if (!s.traffatHinder) {
        this.popup(x, y - 26, text.niva.miss, 'ljusbeige', 'morkgron');
      }
    } else if (!s.traffatHinder) {
      this.popup(Phaser.Math.Clamp(x, 60, 330), Phaser.Math.Clamp(y, 200, 600), text.niva.ute, 'vinrod', 'ljusbeige');
    }

    this.scene.time.delayedCall(900, () => {
      if (this.kvar > 0) this.laddaNasta();
      else this.avslutaNiva();
    });
  }

  private laddaNasta(): void {
    const { x, y } = this.bana.utslag;
    this.projektil.setPosition(x, y).setScale(0).setVisible(true);
    this.scene.tweens.add({ targets: this.projektil, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.ritaBand(x, y);
  }

  private avslutaNiva(): void {
    if (this.klar) return;
    this.klar = true;
    this.kontext.avsluta({ poang: this.poang, skadestand: this.skadestand, nollstallt: this.nollstallt });
  }

  // ---------- Grafik ----------

  private ritaSlangbella(): void {
    const { x, y } = this.bana.utslag;
    const g = this.scene.add.graphics().setDepth(DJUP.bage);
    g.lineStyle(5, farg.beige, 1);
    g.lineBetween(x - 30, y + 60, x - 21, y - 18);
    g.lineBetween(x + 30, y + 60, x + 21, y - 18);
    g.fillStyle(farg.lila, 1).fillCircle(x - 21, y - 18, 4).fillCircle(x + 21, y - 18, 4);
  }

  private ritaBand(px: number, py: number): void {
    const { x, y } = this.bana.utslag;
    this.band.clear().lineStyle(2, farg.lila, 1);
    this.band.lineBetween(x - 21, y - 18, px, py);
    this.band.lineBetween(x + 21, y - 18, px, py);
  }

  private uppdateraHud(): void {
    this.hud.visaMatare(this.matarVarde);
    this.hud.visaKvar(this.kvar);
    this.hud.visaKostnad(this.skadestand);
  }

  private popup(x: number, y: number, innehall: string, bakgrund: FargNamn, textFarg: FargNamn): void {
    const p = pratbubbla(this.scene, x, y, innehall, bakgrund, textFarg).setDepth(DJUP.popup).setScale(0.6);
    this.scene.tweens.add({ targets: p, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: p, y: y - 18, alpha: 0, delay: 1100, duration: 400, onComplete: () => p.destroy() });
  }
}
