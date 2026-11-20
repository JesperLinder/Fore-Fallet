/**
 * Memorymekaniken. Ett rutnät med kort (storlek, kort och regler från nivåfilens "memory") som blandas varje gång.
 * Spelaren vänder två kort per drag. Har de samma parnyckel ("par") stannar de uppe som ett hittat par; annars
 * vänds de tillbaka efter vandTillbakaMs (standard 0,8 s). Ett tredje kort går inte att vända medan två är uppe.
 * Matchningen sker på parnyckeln, inte etiketten, så ett par kan vara två olika kort.
 *
 * Specialkort har en "effekt" som körs när kortet vänds upp (se EFFEKTER nedan; ny effekt = ny rad där).
 * HUD: par hittade, drag, valfri tid och valfri mätare (ett steg per miss). Vinst och förlust kommer ur nivåfilen;
 * stjärnorna räknas på antal drag (stjarnkrav.maxDrag).
 *
 * Vändningen är en kort 3D-vändning (cirka 250 ms). Med inställningen för reducerad rörelse i telefonen/datorn
 * (prefers-reduced-motion) byts den mot en snabb toning.
 */
import Phaser from 'phaser';
import { arMork, avstand, farg, radie, type FargNamn } from '../config/theme';
import { BREDD, HOJD } from '../config/display';
import type { MemoryEffekt, MemoryInstallningar, MemoryKort, Niva } from '../core/levelTypes';
import type { Mekanik, MekanikKontext } from './Mechanic';
import { skapaText } from '../ui/text';
import { fyllStjarna } from '../ui/shapes';
import { spelTips } from '../ui/TipPanel';
import { spela } from '../core/sound';
import { visaStart } from './common/startPanel';
import { byggMemoryHud, type MemoryHud } from './memory/hud';
import { ritaForm } from './memory/forms';

/** Hela vändningen (ner till kanten och upp igen). */
const VAND_MS = 250;
const TONING_MS = 120;
const MELLANRUM = 8;
const MIN_KORT_H = 72;
const MAX_KORT_H = 100;
/** Plats längst ner för teckenförklaringen och fylgians tips. */
const NEDRE_MARGINAL = 150;
const DJUP_KORT = 10;

interface Kort {
  data: MemoryKort;
  /** Index i rutnätet (rad * kolumner + kolumn). Ändras när korten blandas om. */
  plats: number;
  obj: Phaser.GameObjects.Container;
  bak: Phaser.GameObjects.Graphics;
  fram: Phaser.GameObjects.Container;
  /** Markeringen för hittat par. */
  hittadMarkering: Phaser.GameObjects.Graphics;
  dimma: Phaser.GameObjects.Graphics;
  uppe: boolean;
  hittad: boolean;
  /** Dimman ligger kvar till den här tidpunkten (spelad tid, ms). 0 = ingen dimma. */
  dimmaTill: number;
}

/**
 * Effekterna för specialkort. Nyckeln är "typ" i nivåfilens effekt. Effekten körs när kortet vänds upp.
 * Lägg till en ny effekt här (och beskriv den i MemoryEffekt i core/levelTypes.ts och i _mall-memory.md).
 */
const EFFEKTER: Record<string, (m: Memory, kort: Kort, e: MemoryEffekt) => void> = {
  /** Dimma över korten runt omkring i "sekunder" (standard 3); "avstand" 1 = de närmaste, även diagonalt. */
  dimma: (m, kort, e) => m.dimma(kort, (e.sekunder ?? 3) * 1000, e.avstand ?? 1),
  /** Blandar om alla kort som inte är hittade, när draget är klart. */
  blanda: (m) => m.efterDraget(() => m.blanda()),
};

export class Memory implements Mekanik {
  private scene: Phaser.Scene;
  private niva: Niva;
  private inst: MemoryInstallningar;
  private hud: MemoryHud;
  private kort: Kort[] = [];
  private uppe: Kort[] = [];
  /** Saker som ska göras när draget är klart (inga kort uppe), t.ex. blanda om. */
  private vantande: (() => void)[] = [];
  private platser: Phaser.Math.Vector2[] = [];
  private kortB = 0;
  private kortH = 0;
  private totaltPar: number;
  private par = 0;
  private drag = 0;
  private missar = 0;
  /** Spelad tid i ms (står still i pausen och före "Starta"). */
  private klocka = 0;
  private tidKvar: number;
  private startad = false;
  private pausad = false;
  private klar = false;
  private reduceradRorelse: boolean;

  constructor(private kontext: MekanikKontext) {
    this.scene = kontext.scene;
    this.niva = kontext.niva;
    if (!this.niva.memory) throw new Error(`Nivån "${this.niva.id}" saknar "memory"-inställningar`);
    this.inst = this.niva.memory;
    this.reduceradRorelse = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.tidKvar = this.inst.tid?.sekunder ?? 0;

    this.hud = byggMemoryHud(this.scene, this.inst);
    const kortData = this.inst.kort.flatMap((k) => Array.from({ length: k.antal ?? 1 }, () => k));
    this.totaltPar = new Set(kortData.map((k) => k.par)).size;
    this.byggRutnat(kortData);
    this.byggTeckenforklaring();

    this.hud.visaPar(0, this.totaltPar);
    this.hud.visaDrag(0);
    this.hud.visaTid(this.tidKvar);
    this.hud.visaMatare(0);

    visaStart(this.scene, kontext.tips, () => {
      this.startad = true;
      if (this.inst.tipsUnderSpel) {
        const t = spelTips(this.scene, this.niva.fylgiaTips, this.niva.tema ?? 'ljus').setAlpha(0);
        this.scene.tweens.add({ targets: t, alpha: 1, duration: 300 });
      }
    });
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }

  pausa(pausad: boolean): void {
    this.pausad = pausad;
  }

  forstor(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }

  // ---------- Bygg ----------

  private byggRutnat(kortData: MemoryKort[]): void {
    const { kolumner, rader } = this.inst;
    const x0 = avstand.l;
    const y0 = this.hud.nederkant + 14;
    this.kortB = (BREDD - x0 * 2 - MELLANRUM * (kolumner - 1)) / kolumner;
    const tillganglig = HOJD - NEDRE_MARGINAL - y0 - MELLANRUM * (rader - 1);
    this.kortH = Phaser.Math.Clamp(Math.floor(tillganglig / rader), MIN_KORT_H, MAX_KORT_H);
    for (let r = 0; r < rader; r++) {
      for (let k = 0; k < kolumner; k++) {
        this.platser.push(new Phaser.Math.Vector2(x0 + k * (this.kortB + MELLANRUM) + this.kortB / 2, y0 + r * (this.kortH + MELLANRUM) + this.kortH / 2));
      }
    }
    if (kortData.length > this.platser.length) {
      console.warn(`Memory "${this.niva.id}": ${kortData.length} kort men bara ${this.platser.length} platser i rutnätet.`);
    }
    // Ny blandning varje gång nivån startar.
    const blandade = Phaser.Utils.Array.Shuffle([...kortData]).slice(0, this.platser.length);
    this.kort = blandade.map((data, i) => this.byggKort(data, i));
  }

  private byggKort(data: MemoryKort, plats: number): Kort {
    const s = this.scene;
    const w = this.kortB;
    const h = this.kortH;

    // Baksidan: mörkgrön med den lila fyruddiga stjärnan.
    const bak = s.add.graphics();
    bak.fillStyle(farg.morkgron, 1).fillRoundedRect(-w / 2, -h / 2, w, h, radie.m);
    bak.lineStyle(1, farg.gron, 1).strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, radie.m - 2);
    fyllStjarna(bak, 0, 0, Math.min(w, h) * 0.42, farg.lila);

    // Framsidan: färg, valfri kant, valfri symbol och etiketten.
    const fargNamn = data.farg ?? 'ljusbeige';
    const mork = arMork(fargNamn);
    const textFarg: FargNamn = mork ? 'ljusbeige' : 'morkgron';
    const bakgrund = s.add.graphics();
    bakgrund.fillStyle(farg[fargNamn], 1).fillRoundedRect(-w / 2, -h / 2, w, h, radie.m);
    if (data.kant) bakgrund.lineStyle(3, farg[data.kant], 1).strokeRoundedRect(-w / 2 + 2.5, -h / 2 + 2.5, w - 5, h - 5, radie.m - 2);
    else if (!mork) bakgrund.lineStyle(1, farg.beige, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, radie.m);
    // Symbolen (om den finns) i övre delen, etiketten under; utan symbol står etiketten mitt på kortet.
    const formG = s.add.graphics({ y: -h * 0.17 });
    const harForm = ritaForm(formG, data.form, Math.min(28, h * 0.3), farg[textFarg]);
    const etikettY = harForm ? h * 0.2 : 0;
    const etikett = skapaText(s, 0, etikettY, data.etikett, 'knapp', textFarg, {
      origo: [0.5, 0.5],
      bredd: w - 10,
      justering: 'center',
      storlek: 12,
    });
    // Ett långt ord (t.ex. "Väggpanelen") ska inte brytas mitt i: krymp texten tills det längsta ordet ryms.
    etikett.setWordWrapWidth(null);
    const langstaOrd = Math.max(...data.etikett.split(' ').map((ord) => etikett.setText(ord).width));
    etikett.setText(data.etikett).setWordWrapWidth(w - 10);
    if (langstaOrd > w - 10) etikett.setFontSize(Math.max(9, Math.floor((12 * (w - 10)) / langstaOrd)));
    const fram = s.add.container(0, 0, [bakgrund, formG, etikett]).setVisible(false);

    // Hittat par: lila kant och en liten lila stjärna i hörnet.
    const hittadMarkering = s.add.graphics().setVisible(false);
    hittadMarkering.lineStyle(3, farg.lila, 1).strokeRoundedRect(-w / 2 - 1.5, -h / 2 - 1.5, w + 3, h + 3, radie.m + 1);
    hittadMarkering.fillStyle(farg.lila, 1).fillCircle(w / 2 - 12, -h / 2 + 12, 9);
    fyllStjarna(hittadMarkering, w / 2 - 12, -h / 2 + 12, 12, farg.ljusbeige);

    const dimma = s.add.graphics().setAlpha(0);
    ritaDimma(dimma, w, h);

    const p = this.platser[plats];
    const obj = s.add.container(p.x, p.y, [bak, fram, hittadMarkering, dimma]).setDepth(DJUP_KORT).setSize(w, h);
    obj.setInteractive({ useHandCursor: true });
    const kort: Kort = { data, plats, obj, bak, fram, hittadMarkering, dimma, uppe: false, hittad: false, dimmaTill: 0 };
    obj.on('pointerup', () => this.tryck(kort));
    return kort;
  }

  /** Raderna under rutnätet: hittat par, specialkort, dimma. */
  private byggTeckenforklaring(): void {
    const rader = this.inst.teckenforklaring;
    if (!rader?.length) return;
    const sista = this.platser[this.platser.length - 1];
    const y = sista.y + this.kortH / 2 + 22;
    const s = this.scene;
    const delar = rader.map((r) => {
      const g = s.add.graphics();
      const t = skapaText(s, 22, 0, r.text, 'liten', 'morkgron', { origo: [0, 0.5], storlek: 12 });
      if (r.typ === 'hittat') {
        g.fillStyle(farg.ljusbeige, 1).fillRoundedRect(0, -8, 16, 16, 4);
        g.lineStyle(2, farg.lila, 1).strokeRoundedRect(0, -8, 16, 16, 4);
        fyllStjarna(g, 8, 0, 9, farg.lila);
      } else if (r.typ === 'dimma') {
        g.fillStyle(farg.morkgron, 1).fillRoundedRect(0, -8, 16, 16, 4);
        g.fillStyle(farg.beige, 0.8).fillRoundedRect(0, -8, 16, 16, 4);
        g.fillStyle(farg.ljusbeige, 0.7).fillCircle(5, -2, 4).fillCircle(11, 3, 4);
      } else {
        g.fillStyle(farg[r.farg ?? 'morkgron'], 1).fillRoundedRect(0, -8, 16, 16, 4);
      }
      return { c: s.add.container(0, y, [g, t]), b: 22 + t.width };
    });
    const total = delar.reduce((summa, d) => summa + d.b, 0) + (delar.length - 1) * 18;
    let x = (BREDD - total) / 2;
    for (const d of delar) {
      d.c.setX(x).setDepth(DJUP_KORT);
      x += d.b + 18;
    }
  }

  // ---------- Spelet ----------

  private aktiv(): boolean {
    return this.startad && !this.pausad && !this.klar;
  }

  private arDimmad(k: Kort): boolean {
    return k.dimmaTill > this.klocka;
  }

  private tryck(k: Kort): void {
    if (!this.aktiv() || k.hittad || k.uppe || this.arDimmad(k) || this.uppe.length >= 2) return;
    k.uppe = true;
    this.uppe.push(k);
    spela('flipp');
    this.vand(k, true);
    const effekt = k.data.effekt ? EFFEKTER[k.data.effekt.typ] : undefined;
    if (k.data.effekt && !effekt) console.warn(`Memory: okänd effekt "${k.data.effekt.typ}"`);
    if (effekt && k.data.effekt) effekt(this, k, k.data.effekt);
    if (this.uppe.length < 2) return;

    this.drag += 1;
    this.hud.visaDrag(this.drag);
    const [a, b] = this.uppe;
    if (a.data.par === b.data.par) {
      this.scene.time.delayedCall(VAND_MS, () => this.parHittat(a, b));
      return;
    }
    this.scene.time.delayedCall(VAND_MS, () => this.miss());
    this.scene.time.delayedCall(VAND_MS + (this.inst.vandTillbakaMs ?? 800), () => {
      if (this.klar) return;
      for (const kort of [a, b]) {
        kort.uppe = false;
        this.vand(kort, false);
      }
      this.uppe = [];
      this.draget();
    });
  }

  private parHittat(a: Kort, b: Kort): void {
    if (this.klar) return;
    for (const k of [a, b]) {
      k.hittad = true;
      k.uppe = false;
      k.obj.disableInteractive();
      k.hittadMarkering.setVisible(true).setAlpha(0);
      this.scene.tweens.add({ targets: k.hittadMarkering, alpha: 1, duration: 200 });
      if (!this.reduceradRorelse) this.scene.tweens.add({ targets: k.obj, scale: 1.06, duration: 110, yoyo: true });
    }
    this.uppe = [];
    this.par += 1;
    this.hud.visaPar(this.par, this.totaltPar);
    spela('par');
    this.draget();
    if (this.inst.vinst === 'alla-par' && this.par >= this.totaltPar) this.avsluta();
  }

  private miss(): void {
    if (this.klar) return;
    spela('miss');
    this.missar += 1;
    if (!this.inst.matare) return;
    this.hud.visaMatare(this.missar);
    this.hud.markeraMatare();
    if (this.missar >= this.inst.matare.steg && this.inst.forlust.includes('matare-full')) this.avsluta('matare-full');
  }

  /** Draget är klart (inga kort uppe): kör det som väntar, t.ex. omblandning. */
  private draget(): void {
    const v = this.vantande;
    this.vantande = [];
    for (const f of v) f();
  }

  /** Gör något när draget är klart (direkt om inga kort är uppe). Används av effekterna. */
  efterDraget(f: () => void): void {
    if (this.uppe.length === 0) f();
    else this.vantande.push(f);
  }

  /** Dimma över korten runt "fran" i ms. De syns suddiga och går inte att vända under tiden. */
  dimma(fran: Kort, ms: number, avstand: number): void {
    const k0 = this.inst.kolumner;
    const [fk, fr] = [fran.plats % k0, Math.floor(fran.plats / k0)];
    for (const k of this.kort) {
      if (k === fran || k.hittad || k.uppe) continue;
      const [kk, kr] = [k.plats % k0, Math.floor(k.plats / k0)];
      if (Math.abs(kk - fk) > avstand || Math.abs(kr - fr) > avstand) continue;
      const nyDimma = !this.arDimmad(k);
      k.dimmaTill = Math.max(k.dimmaTill, this.klocka + ms);
      if (nyDimma) {
        this.scene.tweens.killTweensOf(k.dimma);
        this.scene.tweens.add({ targets: k.dimma, alpha: 1, duration: this.reduceradRorelse ? 80 : 250 });
      }
    }
  }

  /** Blandar om alla kort som inte är hittade (och inte uppe). */
  blanda(): void {
    const kvar = this.kort.filter((k) => !k.hittad && !k.uppe);
    const platser = Phaser.Utils.Array.Shuffle(kvar.map((k) => k.plats));
    kvar.forEach((k, i) => {
      k.plats = platser[i];
      const p = this.platser[k.plats];
      if (this.reduceradRorelse) k.obj.setPosition(p.x, p.y);
      else this.scene.tweens.add({ targets: k.obj, x: p.x, y: p.y, duration: 320, ease: 'Sine.easeInOut' });
    });
  }

  /** Vänder kortet upp eller ner: 3D-vändning, eller toning med reducerad rörelse. */
  private vand(k: Kort, upp: boolean): void {
    const tw = this.scene.tweens;
    tw.killTweensOf(k.obj);
    tw.killTweensOf(k.fram);
    if (this.reduceradRorelse) {
      k.fram.setVisible(true).setAlpha(upp ? 0 : 1);
      tw.add({ targets: k.fram, alpha: upp ? 1 : 0, duration: TONING_MS, onComplete: () => k.fram.setVisible(upp) });
      return;
    }
    k.obj.setScale(1);
    tw.add({
      targets: k.obj,
      scaleX: 0,
      scaleY: 1.05,
      duration: VAND_MS / 2,
      ease: 'Sine.easeIn',
      onComplete: () => {
        k.fram.setVisible(upp).setAlpha(1);
        k.bak.setVisible(!upp);
        tw.add({ targets: k.obj, scaleX: 1, scaleY: 1, duration: VAND_MS / 2, ease: 'Sine.easeOut' });
      },
    });
  }

  private uppdatera(_t: number, dt: number): void {
    if (!this.aktiv()) return;
    dt = Math.min(dt, 50);
    this.klocka += dt;
    // Dimman lättar.
    for (const k of this.kort) {
      if (k.dimmaTill > 0 && k.dimmaTill <= this.klocka) {
        k.dimmaTill = 0;
        this.scene.tweens.add({ targets: k.dimma, alpha: 0, duration: this.reduceradRorelse ? 80 : 300 });
      }
    }
    if (this.inst.tid) {
      this.tidKvar -= dt / 1000;
      this.hud.visaTid(this.tidKvar);
      if (this.tidKvar <= 0 && this.inst.forlust.includes('tid-slut')) this.avsluta('tid-slut');
    }
  }

  private avsluta(forlust?: 'tid-slut' | 'matare-full'): void {
    if (this.klar) return;
    this.klar = true;
    spela(forlust ? 'misstag' : 'vinst');
    this.kontext.avsluta({
      poang: 0,
      skadestand: 0,
      nollstallt: false,
      drag: this.drag,
      misstag: this.missar,
      tidKvar: Math.max(0, this.tidKvar),
      forlust,
    });
  }
}

/** Dimman över ett kort: tät beige slöja med mjuka moln, så att kortet syns suddigt. */
function ritaDimma(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  g.fillStyle(farg.beige, 0.82).fillRoundedRect(-w / 2, -h / 2, w, h, radie.m);
  g.fillStyle(farg.ljusbeige, 0.55);
  for (const [x, y, r] of [
    [-0.25, -0.25, 0.3],
    [0.2, -0.1, 0.34],
    [-0.15, 0.2, 0.32],
    [0.25, 0.3, 0.26],
  ]) {
    g.fillCircle(x * w, y * h, r * Math.min(w, h));
  }
  g.lineStyle(1, farg.beige, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, radie.m);
}
