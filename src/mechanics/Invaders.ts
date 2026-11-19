/**
 * Invaders-mekaniken. Spelaren flyttas i sidled längst ner och skjuter uppåt mot ett rutnät av brickor
 * som rör sig stegvis nedåt. "fel"-brickor ska skjutas bort, "ratt"-brickor får inte träffas.
 * Valfritt: fallande fångstobjekt, skydd, nedräkning. Allt nivåspecifikt kommer från nivåfilen ("invaders").
 *
 * Styrning: dra var som helst för att flytta (relativt, så fingret inte skymmer), släpp för att skjuta.
 * Med skott.lage "auto" skjuter spelaren i stället hela tiden medan fingret är nere.
 */
import Phaser from 'phaser';
import { avstand, farg, radie } from '../config/theme';
import { BREDD, HOJD, MITT_X } from '../config/display';
import { text } from '../config/strings';
import type { ForlustOrsak, InvadersInstallningar, Niva, SkyddData } from '../core/levelTypes';
import { spela } from '../core/sound';
import type { Mekanik, MekanikKontext } from './Mechanic';
import { ritaFigur } from './art';
import { Rutnat, type Bricka } from './invaders/grid';
import { aterstall, fallSteg, skapaFangst, type Fangst } from './invaders/falling';
import { byggHud, INFO_Y, INFO_H, type InvadersHud } from './invaders/hud';
import { skapaText } from '../ui/text';
import { streckadLinje } from '../ui/shapes';
import { Knapp } from '../ui/Button';

const SKOTT_B = 5;
const SKOTT_H = 14;
/** Skott ovanför den här linjen försvinner (under inforutan). */
const SKOTT_TAK = INFO_Y + INFO_H;
/** Minsta tid mellan två färgblinkar – håller blinkandet under tre gånger per sekund. */
const MIN_BLINK_MS = 400;

interface Skydd {
  data: SkyddData;
  obj: Phaser.GameObjects.Container;
  kvar: number;
}

export class Invaders implements Mekanik {
  private scene: Phaser.Scene;
  private niva: Niva;
  private inst: InvadersInstallningar;
  private hud: InvadersHud;
  private rutnat: Rutnat;
  private fangst: Fangst[];
  private skydd: Skydd[];
  private spelare: Phaser.GameObjects.Graphics;
  private sikte: Phaser.GameObjects.Graphics;
  private blink: Phaser.GameObjects.Rectangle;
  private skott: Phaser.GameObjects.Rectangle[] = [];
  private instruktion?: Phaser.GameObjects.Text;

  private startad = false;
  private pausad = false;
  private klar = false;
  private tidKvar: number;
  private matarSteg = 0;
  private misstag = 0;
  private fangade = 0;
  private sistaSkott = -Infinity;
  private sistaBlink = -Infinity;
  private klocka = 0;

  private fingerNere = false;
  private dragStartX = 0;
  private spelareStartX = 0;

  constructor(private kontext: MekanikKontext) {
    this.scene = kontext.scene;
    this.niva = kontext.niva;
    if (!this.niva.invaders) throw new Error(`Nivån "${this.niva.id}" saknar "invaders"-inställningar`);
    this.inst = this.niva.invaders;
    this.tidKvar = this.inst.tid?.sekunder ?? Infinity;

    this.hud = byggHud(this.scene, this.inst);
    this.rutnat = new Rutnat(this.scene, this.inst.brickor);
    this.skydd = (this.inst.skydd ?? []).map((d) => this.skapaSkydd(d));
    this.fangst = (this.inst.fangst ?? []).map((d) => skapaFangst(this.scene, d));
    this.ritaInstruktion();

    this.sikte = this.scene.add.graphics().setDepth(8);
    this.spelare = this.scene.add.graphics({ x: MITT_X, y: this.inst.spelare.y }).setDepth(20);
    ritaFigur(this.spelare, this.inst.spelare.utseende, 0, 0, this.inst.spelare.b, this.inst.spelare.h);
    this.blink = this.scene.add.rectangle(MITT_X, HOJD / 2, BREDD, HOJD, farg.vinrod, 1).setDepth(60).setAlpha(0);

    this.hud.visaTid(this.tidKvar);
    this.hud.visaMatare(0);
    this.visaStart();

    this.scene.input.on('pointerdown', this.ner, this);
    this.scene.input.on('pointermove', this.flytta, this);
    this.scene.input.on('pointerup', this.upp, this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }

  // ---------- Start ----------

  /** Uppdrag och tips visas i mitten med en "Starta"-knapp. Klockan går först när man tryckt. */
  private visaStart(): void {
    const tips = this.kontext.tips;
    const tacke = this.scene.add.rectangle(MITT_X, HOJD / 2, BREDD, HOJD, farg.morkgron, 0.6).setDepth(45).setInteractive();
    // Panelens höjd = underkanten på dess lägsta text + marginal (grafik har ingen egen storlek).
    const texter = tips.list.filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text);
    const tipsH = Math.max(...texter.map((t) => t.y + t.height)) + 16;
    tips.setY(HOJD / 2 - tipsH / 2 - 40);
    const knapp = new Knapp(this.scene, MITT_X, tips.y + tipsH + 48, text.niva.starta, { bredd: 200, variant: 'guld' }, () => {
      tacke.destroy();
      knapp.destroy();
      this.scene.tweens.add({ targets: tips, alpha: 0, duration: 200, onComplete: () => tips.setVisible(false) });
      this.startad = true;
    }).setDepth(51);
  }

  private ritaInstruktion(): void {
    const ins = this.inst.instruktion;
    if (!ins) return;
    const t = skapaText(this.scene, MITT_X, ins.y, ins.text, 'brod', 'ljusbeige', { origo: [0.5, 0.5], storlek: 14 }).setDepth(9);
    this.instruktion = t;
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 6000, duration: 800 });
  }

  private skapaSkydd(d: SkyddData): Skydd {
    const g = this.scene.add.graphics();
    g.lineStyle(1.5, farg.lila, 1).strokeRoundedRect(-d.b / 2, -d.h / 2, d.b, d.h, radie.s - 2);
    const t = skapaText(this.scene, 0, 0, d.etikett, 'etikett', 'lila', { origo: [0.5, 0.5], storlek: 11 });
    const obj = this.scene.add.container(d.x, d.y, [g, t]).setDepth(9);
    return { data: d, obj, kvar: d.talighet };
  }

  // ---------- Styrning ----------

  private aktiv(): boolean {
    return this.startad && !this.pausad && !this.klar;
  }

  private varldsX(p: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    return this.scene.cameras.main.getWorldPoint(p.x, p.y);
  }

  private ner(p: Phaser.Input.Pointer): void {
    if (!this.aktiv()) return;
    const v = this.varldsX(p);
    if (v.y < INFO_Y) return; // sidhuvudet (pausknappen)
    this.fingerNere = true;
    this.dragStartX = v.x;
    this.spelareStartX = this.spelare.x;
  }

  private flytta(p: Phaser.Input.Pointer): void {
    if (!this.fingerNere || !this.aktiv()) return;
    const halv = this.inst.spelare.b / 2 + 4;
    const x = this.spelareStartX + (this.varldsX(p).x - this.dragStartX);
    this.spelare.x = Phaser.Math.Clamp(x, avstand.l + halv, BREDD - avstand.l - halv);
  }

  private upp(): void {
    if (!this.fingerNere) return;
    this.fingerNere = false;
    if (this.aktiv() && this.inst.skott.lage === 'slapp') this.skjut();
  }

  private skjut(): void {
    if (this.klocka - this.sistaSkott < this.inst.skott.intervall) return;
    this.sistaSkott = this.klocka;
    const y = this.spelare.y - this.inst.spelare.h / 2 - SKOTT_H / 2;
    this.skott.push(this.scene.add.rectangle(this.spelare.x, y, SKOTT_B, SKOTT_H, farg.guld).setDepth(15));
    spela('skott');
  }

  // ---------- Spelloopen ----------

  private uppdatera(_tid: number, dt: number): void {
    if (!this.aktiv()) return;
    dt = Math.min(dt, 50); // hoppa inte långt efter en hackning
    this.klocka += dt;

    if (this.inst.tid) {
      this.tidKvar -= dt / 1000;
      this.hud.visaTid(this.tidKvar);
    }
    if (this.fingerNere && this.inst.skott.lage === 'auto') this.skjut();

    this.rutnat.uppdatera(dt);
    this.flyttaSkott(dt);
    this.flyttaFangst(dt);
    this.ritaSikte();
    this.kollaSlut();
  }

  private flyttaSkott(dt: number): void {
    const dy = (this.inst.skott.fart * dt) / 1000;
    this.skott = this.skott.filter((s) => {
      s.y -= dy;
      const traff = this.skottTraffar(s.x, s.y - SKOTT_H / 2);
      if (traff || s.y < SKOTT_TAK) {
        s.destroy();
        return false;
      }
      return true;
    });
  }

  /** Hanterar träff mot skydd eller bricka. Returnerar true om skottet ska försvinna. */
  private skottTraffar(x: number, y: number): boolean {
    const skydd = this.skydd.find(
      (s) => s.kvar > 0 && Math.abs(x - s.data.x) <= s.data.b / 2 && Math.abs(y - s.data.y) <= s.data.h / 2,
    );
    if (skydd) {
      skydd.kvar -= 1;
      skydd.obj.setAlpha(0.25 + (0.75 * skydd.kvar) / skydd.data.talighet);
      if (skydd.kvar <= 0) skydd.obj.destroy();
      return true;
    }
    const bricka = this.rutnat.traff(x, y);
    if (!bricka) return false;
    if (bricka.data.typ === 'fel') {
      this.rutnat.taBort(bricka);
      spela('traff');
    } else {
      this.skakaBricka(bricka);
      this.registreraMisstag(this.inst.misstag.rattTraffad);
    }
    return true;
  }

  private skakaBricka(b: Bricka): void {
    const x = b.obj.x;
    this.scene.tweens.add({ targets: b.obj, x: x + 4, duration: 50, yoyo: true, repeat: 2, onComplete: () => b.obj.setX(x) });
  }

  private flyttaFangst(dt: number): void {
    const sp = this.inst.spelare;
    for (const f of this.fangst) {
      if (f.fangad || !f.obj.visible) continue;
      fallSteg(f, dt);
      const nara = Math.abs(f.obj.x - this.spelare.x) < sp.b / 2 + f.r && Math.abs(f.obj.y - this.spelare.y) < sp.h / 2 + f.r;
      if (nara) this.fanga(f);
      else if (f.obj.y - f.r > sp.y + sp.h / 2 + 8) {
        this.registreraMisstag(this.inst.misstag.fangstMissad);
        aterstall(this.scene, f);
      }
    }
  }

  private fanga(f: Fangst): void {
    f.fangad = true;
    const mal = this.hud.fangstPlats(this.fangade++);
    spela('fanga');
    this.scene.tweens.add({ targets: f.obj, x: mal.x, y: mal.y, scale: 0.6, duration: 260, ease: 'Quad.easeOut' });
  }

  /** Prickad siktlinje rakt upp från spelaren medan fingret är nere. */
  private ritaSikte(): void {
    this.sikte.clear();
    if (!this.fingerNere) return;
    const topp = Math.max(this.rutnat.nedersta() + 8, SKOTT_TAK);
    const botten = this.spelare.y - this.inst.spelare.h / 2 - 10;
    if (botten <= topp) return;
    this.sikte.lineStyle(2, farg.guld, 0.9);
    const punkter = [new Phaser.Math.Vector2(this.spelare.x, botten), new Phaser.Math.Vector2(this.spelare.x, topp)];
    streckadLinje(this.sikte, punkter, 2, 6);
  }

  // ---------- Misstag, vinst och förlust ----------

  private registreraMisstag(steg: number): void {
    this.misstag += 1;
    this.matarSteg = Math.min(this.inst.matare.steg, this.matarSteg + steg);
    this.hud.visaMatare(this.matarSteg);
    this.hud.markeraMatare();
    spela('misstag');
    this.scene.cameras.main.shake(160, 0.004);
    if (this.klocka - this.sistaBlink >= MIN_BLINK_MS) {
      this.sistaBlink = this.klocka;
      this.blink.setAlpha(0.3);
      this.scene.tweens.add({ targets: this.blink, alpha: 0, duration: 320 });
    }
  }

  private kollaSlut(): void {
    const f = this.inst.forlust;
    const sp = this.inst.spelare;
    if (f.includes('matare-full') && this.matarSteg >= this.inst.matare.steg) return this.forlora('matare-full');
    if (f.includes('tid-slut') && this.tidKvar <= 0) return this.forlora('tid-slut');
    if (f.includes('botten') && this.rutnat.nedersta() >= sp.y - sp.h / 2) return this.forlora('botten');

    const v = this.inst.vinst;
    const felBorta = !v.includes('fel-borta') || this.rutnat.felKvar() === 0;
    const allaFangade = !v.includes('alla-fangade') || this.fangst.every((x) => x.fangad);
    if (felBorta && allaFangade) this.vinna();
  }

  private forlora(orsak: ForlustOrsak): void {
    this.klar = true;
    this.avslutaStyrning();
    spela('misstag');
    this.scene.cameras.main.shake(260, 0.006);
    this.kontext.avsluta({ poang: 0, skadestand: 0, nollstallt: true, misstag: this.misstag, tidKvar: this.tidKvar, forlust: orsak });
  }

  private vinna(): void {
    this.klar = true;
    this.avslutaStyrning();
    const tid = this.bildaSlutrad();
    this.scene.time.delayedCall(tid, () =>
      this.kontext.avsluta({
        poang: 0,
        skadestand: 0,
        nollstallt: false,
        misstag: this.misstag,
        tidKvar: Math.max(0, this.tidKvar),
      }),
    );
  }

  /** Flyttar brickor och fångstobjekt med "plats" till en rad, t.ex. KROGKUNG. Returnerar animationens längd (ms). */
  private bildaSlutrad(): number {
    const rad = this.inst.slutrad;
    if (!rad) return 300;
    this.instruktion?.destroy();
    // "storlek" = objektets bredd i full skala, så att allt i raden blir lika högt.
    const delar: { plats: number; obj: Phaser.GameObjects.Container; storlek: number }[] = [];
    for (const b of this.rutnat.brickor) {
      if (b.levande && b.data.plats !== undefined) delar.push({ plats: b.data.plats, obj: this.rutnat.lyftUt(b), storlek: this.inst.brickor.b });
    }
    for (const f of this.fangst) if (f.data.plats !== undefined) delar.push({ plats: f.data.plats, obj: f.obj, storlek: f.r * 2 });
    delar.sort((a, b) => a.plats - b.plats);
    this.rutnat.tonaUtResten();

    const steg = Math.min(44, (BREDD - avstand.l * 2) / Math.max(delar.length, 1));
    const x0 = MITT_X - (steg * (delar.length - 1)) / 2;
    delar.forEach((d, i) => {
      d.obj.setDepth(30);
      this.scene.tweens.add({
        targets: d.obj,
        x: x0 + i * steg,
        y: rad.y,
        scale: (steg - 4) / d.storlek,
        delay: i * 60,
        duration: 420,
        ease: 'Cubic.easeInOut',
      });
    });
    return 420 + delar.length * 60 + 1200;
  }

  private avslutaStyrning(): void {
    this.fingerNere = false;
    this.sikte.clear();
    this.skott.forEach((s) => s.destroy());
    this.skott = [];
  }

  // ---------- Mekanik-gränssnittet ----------

  pausa(pausad: boolean): void {
    this.pausad = pausad;
    if (pausad) {
      this.fingerNere = false;
      this.sikte.clear();
    }
  }

  forstor(): void {
    this.scene.input.off('pointerdown', this.ner, this);
    this.scene.input.off('pointermove', this.flytta, this);
    this.scene.input.off('pointerup', this.upp, this);
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }
}
