/**
 * Skyttar i invaders (sköldläge): rutor högst upp som skjuter märkta projektiler i raka banor mot det som
 * skyddas. En projektil som korsar skölden blockeras (studsar bort med ett klonk); en som når fram träffar
 * (dovt ljud). Mekaniken bedömer utfallet (rules.ts). Flikarna visar märkningarna och tänds vid första träff.
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import type { SkyttarInstallningar } from '../../core/levelTypes';
import { spela } from '../../core/sound';
import { skapaText } from '../../ui/text';
import { streckadRam } from '../../ui/shapes';
import { ritaFigur } from '../art';

const DJUP = 12;
const PROJ_B = 22;
const PROJ_H = 28;
/** Projektilerna i en salva skjuts med så här lång lucka (ms), så att man hinner skilja dem åt. */
const SALVA_LUCKA = 420;

export interface MarktProjektil {
  typ: string;
  markning: string;
  obj: Phaser.GameObjects.Container;
  fran: Phaser.Math.Vector2;
  till: Phaser.Math.Vector2;
  /** Sträcka som avverkats (punkter) och total längd. */
  s: number;
  langd: number;
}

export type Skoldyta = { x: number; y: number; b: number; h: number };

export class Skyttar {
  private aktiva: MarktProjektil[] = [];
  private tillNasta: number;
  private stoppad = false;
  private flikar = new Map<string, Phaser.GameObjects.Container>();
  /** Väntande skott i en salva: tid kvar (ms) och nummer i salvan. */
  private vantande: { tid: number; k: number }[] = [];

  /** vidUtfall anropas när en projektil blockerats eller träffat. */
  constructor(
    private scene: Phaser.Scene,
    private inst: SkyttarInstallningar,
    private skold: () => Skoldyta,
    private vidUtfall: (p: MarktProjektil, blockerad: boolean, x: number, y: number) => void,
  ) {
    this.tillNasta = inst.fordrojning ?? inst.intervall;
    for (const s of inst.skyttar) this.ritaSkytt(s);
    if (inst.flikar) this.ritaFlikar(inst.flikar);
  }

  /** Flytta projektilerna och skjut nya. forlopp = andel av nivåns tid (0–1), styr takten. */
  uppdatera(dt: number, forlopp: number): void {
    if (this.stoppad) return;
    this.tillNasta -= dt;
    if (this.tillNasta <= 0) {
      const i = this.inst;
      this.tillNasta += Phaser.Math.Linear(i.intervall, i.slutIntervall, Phaser.Math.Clamp(forlopp, 0, 1));
      const antal = [...(i.samtidigt ?? [])].reverse().find((s) => forlopp >= s.fran)?.antal ?? 1;
      this.skjut(0);
      for (let k = 1; k < antal; k++) this.vantande.push({ tid: k * SALVA_LUCKA, k });
    }
    this.vantande = this.vantande.filter((v) => {
      v.tid -= dt;
      if (v.tid > 0) return true;
      this.skjut(v.k);
      return false;
    });
    const steg = (this.inst.fart * dt) / 1000;
    const sk = this.skold();
    this.aktiva = this.aktiva.filter((p) => {
      const foreY = p.obj.y;
      p.s = Math.min(p.langd, p.s + steg);
      const pos = p.fran.clone().lerp(p.till, p.s / p.langd);
      p.obj.setPosition(pos.x, pos.y);
      // Korsar skölden: underkanten har passerat sköldens överkant i det här steget, inom sköldens bredd.
      const skoldTopp = sk.y - sk.h / 2;
      if (foreY + PROJ_H / 2 < skoldTopp + 1 && pos.y + PROJ_H / 2 >= skoldTopp && Math.abs(pos.x - sk.x) <= sk.b / 2 + PROJ_B / 2) {
        this.blockera(p);
        return false;
      }
      if (p.s >= p.langd) {
        this.traffa(p);
        return false;
      }
      return true;
    });
  }

  /** Tänder fliken för en märkning (första sanktionen). */
  markera(markning: string): void {
    const f = this.flikar.get(markning);
    if (!f) return;
    const g = f.list[0] as Phaser.GameObjects.Graphics;
    const t = f.list[1] as Phaser.GameObjects.Text;
    g.clear().fillStyle(farg.guld, 1).fillRoundedRect(0, 0, 70, 24, 12);
    t.setColor('#0F2827');
    this.scene.tweens.add({ targets: f, scale: 1.12, duration: 140, yoyo: true });
  }

  stoppa(): void {
    this.stoppad = true;
    for (const p of this.aktiva) this.scene.tweens.add({ targets: p.obj, alpha: 0, duration: 250, onComplete: () => p.obj.destroy() });
    this.aktiva = [];
  }

  // ---------- Skott ----------

  /** Skjuter en projektil. k > 0 = extra i samma salva: tas från en annan skytt om det finns. */
  private skjut(k: number): void {
    const i = this.inst;
    const skytt = i.skyttar[(Phaser.Math.Between(0, i.skyttar.length - 1) + k) % i.skyttar.length];
    const typ = valjViktat(skytt.typer);
    const markning = Phaser.Utils.Array.GetRandom(i.markningar) as string;
    const fran = new Phaser.Math.Vector2(skytt.x + Phaser.Math.Between(-skytt.b / 3, skytt.b / 3), skytt.y + skytt.h / 2 + PROJ_H / 2);
    const till = new Phaser.Math.Vector2(i.mal.x + Phaser.Math.Between(-i.mal.spridning, i.mal.spridning), i.mal.y);
    const obj = this.ritaProjektil(typ, markning).setPosition(fran.x, fran.y);
    this.aktiva.push({ typ, markning, obj, fran, till, s: 0, langd: fran.distance(till) });
  }

  private blockera(p: MarktProjektil): void {
    spela('klonk');
    const sk = this.skold();
    // Studsar bort uppåt och åt sidan, bort från sköldens mitt.
    const riktning = p.obj.x >= sk.x ? 1 : -1;
    this.scene.tweens.add({
      targets: p.obj,
      x: p.obj.x + riktning * 90,
      y: p.obj.y - 70,
      angle: riktning * 160,
      alpha: 0,
      duration: 520,
      ease: 'Quad.easeOut',
      onComplete: () => p.obj.destroy(),
    });
    this.vidUtfall(p, true, p.obj.x, sk.y - 34);
  }

  private traffa(p: MarktProjektil): void {
    spela('duns');
    this.scene.tweens.add({ targets: p.obj, scale: 0.5, alpha: 0, duration: 260, onComplete: () => p.obj.destroy() });
    this.vidUtfall(p, false, p.obj.x, p.obj.y - 50);
  }

  // ---------- Grafik ----------

  /** Ett litet dokument i typens färg med märkningen i mitten och typens namn bredvid. */
  private ritaProjektil(typ: string, markning: string): Phaser.GameObjects.Container {
    const t = this.inst.typer[typ];
    const g = this.scene.add.graphics();
    g.fillStyle(farg[t.farg], 1).fillRoundedRect(-PROJ_B / 2, -PROJ_H / 2, PROJ_B, PROJ_H, 3);
    if (t.streckad) streckadRam(g, -PROJ_B / 2 - 3, -PROJ_H / 2 - 3, PROJ_B + 6, PROJ_H + 6, 5, farg[t.farg]);
    const ljus = t.farg === 'guld' || t.farg === 'beige' || t.farg === 'ljusbeige';
    const bokstav = skapaText(this.scene, 0, 0, markning, 'rubrik', ljus ? 'morkgron' : 'ljusbeige', { origo: [0.5, 0.5], storlek: 15 });
    const namn = skapaText(this.scene, PROJ_B / 2 + 6, 0, t.etikett, 'knapp', t.farg === 'guld' ? 'morkockra' : t.farg, { origo: [0, 0.5], storlek: 10 });
    return this.scene.add.container(0, 0, [g, bokstav, namn]).setDepth(DJUP);
  }

  private ritaSkytt(s: SkyttarInstallningar['skyttar'][number]): void {
    const g = this.scene.add.graphics().setDepth(DJUP - 1);
    g.fillStyle(farg.morkgron, 1).fillRoundedRect(s.x - s.b / 2, s.y - s.h / 2, s.b, s.h, 16);
    if (s.ikon) ritaFigur(g, s.ikon, s.x, s.y - 10, 22, 24, farg.guld);
    skapaText(this.scene, s.x, s.y + s.h / 2 - 16, s.etikett, 'knapp', 'ljusbeige', { origo: [0.5, 0.5], storlek: 13 }).setDepth(DJUP - 1);
  }

  private ritaFlikar(f: NonNullable<SkyttarInstallningar['flikar']>): void {
    if (f.rubrik) skapaText(this.scene, f.x + 70, f.y - 14, f.rubrik, 'overrubrik', 'morkockra', { origo: [1, 0], storlek: 9 }).setDepth(DJUP - 1);
    this.inst.markningar.forEach((m, i) => {
      const g = this.scene.add.graphics();
      g.lineStyle(1, farg.morkgron, 1).strokeRoundedRect(0, 0, 70, 24, 12);
      const t = skapaText(this.scene, 35, 12, `${f.prefix} ${m}`, 'knapp', 'morkgron', { origo: [0.5, 0.5], storlek: 11 });
      const c = this.scene.add.container(f.x, f.y + i * 30, [g, t]).setDepth(DJUP - 1);
      this.flikar.set(m, c);
    });
  }
}

function valjViktat(typer: { typ: string; vikt: number }[]): string {
  const summa = typer.reduce((s, t) => s + t.vikt, 0);
  let r = Math.random() * summa;
  for (const t of typer) {
    r -= t.vikt;
    if (r <= 0) return t.typ;
  }
  return typer[typer.length - 1].typ;
}
