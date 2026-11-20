/**
 * Bogserläget i slangbellan (sidovy): spelaren drar med fingret och ett fordon (t.ex. en bogserbåt) åker dit.
 * Fordonet kopplas med ett elastiskt rep (Matter-constraint) till ett block som då blir rörligt och mycket tungt:
 * trögt att få igång och svårt att stoppa. Vinst när blockets mitt passerat gränsen, förlust när tiden tar slut.
 * Allt styrs av slangbella.bogsera i nivåfilen; mekaniken (Slingshot) får besked via återanropen.
 */
import Phaser from 'phaser';
import { farg, css } from '../../config/theme';
import { BREDD, HOJD } from '../../config/display';
import type { BogseraInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { streckadLinje } from '../../ui/shapes';
import { Knapp } from '../../ui/Button';
import { ritaFigur } from '../art';
import type { Fysikblock } from './blocks';
import type { MatterKropp } from './launcher';

const DJUP_FORDON = 6;
const KNAPP_H = 52;
/** Hur hårt fordonet styr mot fingret (andel av avståndet per steg) och hur fort det saktar in utan finger. */
const STYRNING = 0.08;
const INBROMSNING = 0.9;

export interface BogseringVal {
  vidStart: () => void;
  vidVinst: () => void;
  vidForlust: () => void;
}

export class Bogsering {
  private fordon: Phaser.GameObjects.Graphics;
  private rep: Phaser.GameObjects.Graphics;
  private klockText?: Phaser.GameObjects.Text;
  private knapp?: Knapp;
  private pulsTween?: Phaser.Tweens.Tween;

  private kropp?: MatterKropp;
  private last?: MatterKropp;
  private mal: Phaser.Math.Vector2 | null = null;
  private aktiv = false;
  private startad = false;
  private pausad = false;
  private tidKvar: number;

  constructor(
    private scene: Phaser.Scene,
    private inst: BogseraInstallningar,
    private block: Fysikblock,
    private val: BogseringVal,
  ) {
    this.tidKvar = inst.tid;
    this.ritaGrans();
    this.rep = scene.add.graphics().setDepth(DJUP_FORDON - 0.5);
    this.fordon = scene.add.graphics({ x: inst.fordon.start.x, y: inst.fordon.start.y }).setDepth(DJUP_FORDON);
    ritaFigur(this.fordon, inst.fordon.utseende, 0, 0, inst.fordon.b, inst.fordon.h);
    if (inst.aktivering === 'knapp' && inst.knapp) this.byggKnapp(false);

    scene.input.on('pointerdown', this.ner, this);
    scene.input.on('pointermove', this.flytta, this);
    scene.input.on('pointerup', this.upp, this);
    scene.matter.world.on('beforeupdate', this.styr, this);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }

  get igang(): boolean {
    return this.startad;
  }

  /** Knappen börjar pulsera (högst en puls per sekund) och blir guld, t.ex. när argumenten är slut. */
  pulsera(): void {
    if (!this.knapp || this.pulsTween || this.startad) return;
    this.byggKnapp(true);
    this.pulsTween = this.scene.tweens.add({ targets: this.knapp, scale: 1.06, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Startar bogserläget: fordonet åker till kopplingen, repet fästs, klockan börjar gå. */
  starta(): void {
    if (this.startad) return;
    this.startad = true;
    this.pulsTween?.stop();
    this.knapp?.destroy();
    this.val.vidStart();
    const f = this.inst.fordon;
    this.scene.tweens.add({
      targets: this.fordon,
      x: f.koppling.x,
      y: f.koppling.y,
      duration: 1100,
      ease: 'Sine.easeInOut',
      onComplete: () => this.koppla(),
    });
  }

  pausa(pausad: boolean): void {
    this.pausad = pausad;
    if (pausad) this.mal = null;
  }

  forstor(): void {
    this.scene.input.off('pointerdown', this.ner, this);
    this.scene.input.off('pointermove', this.flytta, this);
    this.scene.input.off('pointerup', this.upp, this);
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
    const varld = this.scene.matter.world as Phaser.Physics.Matter.World | null;
    varld?.off('beforeupdate', this.styr, this);
  }

  // ---------- Uppbyggnad ----------

  private byggKnapp(guld: boolean): void {
    this.knapp?.destroy();
    const k = this.inst.knapp!;
    const b = BREDD - 32;
    this.knapp = new Knapp(this.scene, BREDD / 2, HOJD - 16 - KNAPP_H / 2, k.text, { bredd: b, hojd: KNAPP_H, variant: guld ? 'guld' : 'konturMork' }, () =>
      this.starta(),
    ).setDepth(40);
    if (!guld) this.knapp.setAlpha(0.75); // diskret tills den behövs
  }

  private ritaGrans(): void {
    const { grans } = this.inst;
    const g = this.scene.add.graphics().setDepth(2).lineStyle(2, farg.beige, 0.9);
    streckadLinje(g, [new Phaser.Math.Vector2(grans.x, grans.y1), new Phaser.Math.Vector2(grans.x, grans.y2)], 6, 5);
    skapaText(this.scene, grans.x, grans.y2 + 14, grans.etikett, 'overrubrik', 'beige', { origo: [0.5, 0.5], storlek: 10 }).setDepth(2);
  }

  /** Fäster repet: fordonet blir en kropp, blocket blir rörligt och tungt. */
  private koppla(): void {
    const f = this.inst.fordon;
    const last = this.block.gorRorlig(this.inst.objekt, this.inst.massa, this.inst.luft);
    if (!last) return;
    // Fordon och last krockar inte med varandra (fordonet åker förbi framför).
    last.collisionFilter.group = -1;
    const kropp = this.scene.matter.add.rectangle(f.koppling.x, f.koppling.y, f.b, f.h * 0.6, {
      label: 'fordon',
      ignoreGravity: true,
      frictionAir: 0.05,
      density: 0.002,
      collisionFilter: { group: -1, category: 1, mask: 0 },
    });
    kropp.sleepThreshold = Infinity;
    this.scene.matter.body.setInertia(kropp, Infinity);
    this.scene.matter.add.constraint(kropp, last, this.inst.rep.langd, this.inst.rep.styvhet, {
      pointA: { x: -f.b / 2 + 4, y: 2 },
      pointB: this.inst.rep.fast,
      damping: this.inst.rep.dampning ?? 0.05,
    });
    this.kropp = kropp;
    this.last = last;
    this.aktiv = true;
    this.klockText = skapaText(this.scene, BREDD - 16, 136, '', 'titel', 'guld', { origo: [1, 0.5], storlek: 26 }).setDepth(30);
  }

  // ---------- Styrning ----------

  private ner(p: Phaser.Input.Pointer): void {
    if (!this.aktiv || this.pausad) return;
    this.mal = this.scene.cameras.main.getWorldPoint(p.x, p.y);
  }

  private flytta(p: Phaser.Input.Pointer): void {
    if (!this.mal || !this.aktiv || this.pausad) return;
    this.mal = this.scene.cameras.main.getWorldPoint(p.x, p.y);
  }

  private upp(): void {
    this.mal = null;
  }

  /** Före varje fysiksteg: fordonet styr mot fingret (högst "fart"), annars saktar det in. Håller sig i vattnet. */
  private styr(): void {
    const k = this.kropp;
    if (!k || !this.aktiv) return;
    // Klockan räknar fysiksteg (60 per sekund), så att en långsam telefon inte gör nivån svårare.
    this.tidKvar -= 1 / 60;
    const f = this.inst.fordon;
    let vx = k.velocity.x * INBROMSNING;
    let vy = k.velocity.y * INBROMSNING;
    if (this.mal) {
      const ty = Phaser.Math.Clamp(this.mal.y, f.y.min, f.y.max);
      vx = (this.mal.x - k.position.x) * STYRNING;
      vy = (ty - k.position.y) * STYRNING;
      const fart = Math.hypot(vx, vy);
      if (fart > f.fart) {
        vx = (vx / fart) * f.fart;
        vy = (vy / fart) * f.fart;
      }
    }
    // Håll fordonet i vattnet och på skärmen.
    if (k.position.x > BREDD - f.b / 2) vx = Math.min(vx, -0.5);
    if (k.position.x < f.b / 2) vx = Math.max(vx, 0.5);
    if (k.position.y < f.y.min) vy = Math.max(vy, 0.5);
    if (k.position.y > f.y.max) vy = Math.min(vy, -0.5);
    this.scene.matter.body.setVelocity(k, { x: vx, y: vy });
    this.scene.matter.body.setAngle(k, 0);
  }

  // ---------- Varje bildruta ----------

  private uppdatera(): void {
    if (!this.aktiv || !this.kropp || !this.last) return;
    this.fordon.setPosition(this.kropp.position.x, this.kropp.position.y);
    this.ritaRep();
    if (this.pausad) return;
    const s = Math.max(0, Math.ceil(this.tidKvar));
    this.klockText?.setText(`00:${String(s).padStart(2, '0')}`).setColor(css(s <= 10 ? 'lila' : 'guld'));
    const g = this.inst.grans;
    const halv = (this.block.hamta(this.inst.objekt)?.data.b ?? 0) / 2;
    const matt = this.last.position.x + (g.matpunkt === 'mitt' ? 0 : halv);
    if (matt > g.x) {
      this.avsluta();
      this.val.vidVinst();
    } else if (this.tidKvar <= 0) {
      this.avsluta();
      this.val.vidForlust();
    }
  }

  private avsluta(): void {
    this.aktiv = false;
    this.mal = null;
    if (this.kropp) this.scene.matter.body.setVelocity(this.kropp, { x: 0, y: 0 });
  }

  /** Repet: slakt hänger det i en båge, sträckt blir det rakt. */
  private ritaRep(): void {
    const k = this.kropp!;
    const l = this.last!;
    const f = this.inst.fordon;
    const a = new Phaser.Math.Vector2(k.position.x - f.b / 2 + 4, k.position.y + 2);
    const b = new Phaser.Math.Vector2(l.position.x + this.inst.rep.fast.x, l.position.y + this.inst.rep.fast.y);
    const slack = Math.max(0, this.inst.rep.langd - a.distance(b));
    const mitt = a.clone().lerp(b, 0.5).add(new Phaser.Math.Vector2(0, 2 + slack * 0.9));
    const kurva = new Phaser.Curves.QuadraticBezier(a, mitt, b);
    this.rep.clear().lineStyle(3, farg.beige, 1).strokePoints(kurva.getPoints(16));
  }
}
