/**
 * Tidslinje, genast-mätare och villkorade knappar i invaders (t.ex. Potatispartiet, fas 2).
 * - Tidslinje: datumet tickar fram en dag per sekunderPerDag; linjen visar spannet med markeringar. Varje passerat
 *   datum ger flaggan "datum:ÅÅÅÅ-MM-DD". Händelser knutna till datum spelas av Engangshandelser (scenery.ts).
 * - Genast-mätaren: ett stoppur som töms när en flagga sätts, tickar hörbart och sätter en flagga när det är tomt.
 * - Villkorade knappar: aktiva bara när villkoren är uppfyllda, annars tonade med en kort förklaring.
 * Allt styrs från nivåfilen ("tidslinje", "genast", "knappar"). Tiden går bara medan nivån pågår.
 */
import Phaser from 'phaser';
import { avstand, css, farg, radie } from '../../config/theme';
import { BREDD } from '../../config/display';
import type { GenastInstallningar, TidslinjeInstallningar, VillkoradKnapp } from '../../core/levelTypes';
import { spela } from '../../core/sound';
import { skapaText } from '../../ui/text';

const MS_PER_DAG = 86_400_000;
const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

/** "1977-05-01" -> dagnummer (dagar sedan 1970-01-01). */
export function dagnummer(datum: string): number {
  const [a, m, d] = datum.split('-').map(Number);
  return Math.round(Date.UTC(a, m - 1, d) / MS_PER_DAG);
}

/** Dagnummer -> "1977-05-01". */
function iso(dag: number): string {
  return new Date(dag * MS_PER_DAG).toISOString().slice(0, 10);
}

/** Dagnummer -> "1 maj 1977". */
function lasbart(dag: number): string {
  const d = new Date(dag * MS_PER_DAG);
  return `${d.getUTCDate()} ${MANADER[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Tid (ms från fasens start) då ett datum nås på tidslinjen. */
export function tidForDatum(t: TidslinjeInstallningar, datum: string): number {
  return (dagnummer(datum) - dagnummer(t.startDatum)) * t.sekunderPerDag * 1000;
}

export class Tidslinje {
  private tid = 0;
  private dag: number;
  private fran: number;
  private till: number;
  private slut?: number;
  private avgjord = false;
  private fyll: Phaser.GameObjects.Graphics;
  private datumText: Phaser.GameObjects.Text;
  private x0 = avstand.l + 8;
  private b = BREDD - (avstand.l + 8) * 2;

  /** flagga: anropas med "datum:ÅÅÅÅ-MM-DD" för varje passerat datum. vidSlut: när slutDatum nås. */
  constructor(
    scene: Phaser.Scene,
    private inst: TidslinjeInstallningar,
    private flagga: (namn: string) => void,
    private vidSlut: () => void,
  ) {
    this.fran = dagnummer(inst.fran);
    this.till = dagnummer(inst.till);
    this.dag = dagnummer(inst.startDatum);
    this.slut = inst.slutDatum ? dagnummer(inst.slutDatum) : undefined;
    const y = inst.y;
    const bak = scene.add.graphics().setDepth(5);
    bak.fillStyle(farg.morkgron, 1).fillRoundedRect(this.x0, y - 4, this.b, 8, 4);
    this.fyll = scene.add.graphics().setDepth(6);
    // Etiketterna står över linjen; krockar en med den förra (datumen ligger nära varandra) står den under linjen.
    let forraHoger = -Infinity;
    for (const m of inst.markeringar) {
      const x = this.xFor(dagnummer(m.datum));
      bak.fillStyle(farg.ljusbeige, 1).fillCircle(x, y, 3);
      const t = skapaText(scene, x, y - 16, m.etikett, 'overrubrik', 'ljusbeige', { origo: [0.5, 0.5], storlek: 10 }).setDepth(6);
      t.setX(Phaser.Math.Clamp(x, this.x0 + t.width / 2, this.x0 + this.b - t.width / 2));
      if (t.x - t.width / 2 < forraHoger + 4) t.setY(y + 16);
      else forraHoger = t.x + t.width / 2;
    }
    this.datumText = skapaText(scene, this.x0, y + 18, '', 'knapp', 'guld', { origo: [0, 0.5], storlek: 13 }).setDepth(6);
    if (inst.text) {
      skapaText(scene, this.x0, y + 34, inst.text, 'liten', 'ljusbeige', { origo: [0, 0], bredd: this.b, storlek: 12 }).setDepth(6);
    }
    // Datum fram till och med startdatumet räknas som passerade.
    for (let d = this.fran; d <= this.dag; d++) this.flagga(`datum:${iso(d)}`);
    this.rita();
  }

  uppdatera(dt: number): void {
    if (this.avgjord) return;
    this.tid += dt;
    const dag = dagnummer(this.inst.startDatum) + Math.floor(this.tid / (this.inst.sekunderPerDag * 1000));
    while (this.dag < dag) {
      this.dag += 1;
      this.flagga(`datum:${iso(this.dag)}`);
      if (this.slut !== undefined && this.dag >= this.slut) {
        this.avgjord = true;
        this.vidSlut();
        break;
      }
    }
    this.rita();
  }

  private xFor(dag: number): number {
    return this.x0 + (this.b * Phaser.Math.Clamp((dag - this.fran) / Math.max(1, this.till - this.fran), 0, 1));
  }

  private rita(): void {
    // Fyllnaden går mjukt mellan dagarna.
    const delDag = (this.tid % (this.inst.sekunderPerDag * 1000)) / (this.inst.sekunderPerDag * 1000);
    const x = this.xFor(this.dag + (this.avgjord ? 0 : delDag));
    this.fyll.clear().fillStyle(farg.guld, 1).fillRoundedRect(this.x0, this.inst.y - 4, Math.max(8, x - this.x0), 8, 4);
    this.datumText.setText(lasbart(this.dag));
  }
}

/** Genast-mätaren som ett stoppur: en guldfylld sektor som krymper medan tiden rinner ut. */
export class Genast {
  private g: Phaser.GameObjects.Graphics;
  private kvar: number;
  private igang = false;
  private tom = false;
  private tillTick = 0;

  constructor(
    scene: Phaser.Scene,
    private inst: GenastInstallningar,
    private vidTom: () => void,
  ) {
    this.kvar = inst.sekunder * 1000;
    this.g = scene.add.graphics().setDepth(7);
    skapaText(scene, inst.x, inst.y + inst.r + 14, inst.namn, 'overrubrik', 'ljusbeige', { origo: [0.5, 0.5], storlek: 10 }).setDepth(7);
    this.rita();
  }

  /** Startar tömningen (t.ex. när klagomålen kommer in). */
  starta(): void {
    if (this.igang || this.tom) return;
    this.igang = true;
  }

  /** Sant så länge mätaren har innehåll. */
  harInnehall(): boolean {
    return !this.tom;
  }

  uppdatera(dt: number): void {
    if (!this.igang || this.tom) return;
    this.kvar = Math.max(0, this.kvar - dt);
    this.tillTick -= dt;
    if (this.tillTick <= 0) {
      this.tillTick += 500;
      if (this.inst.ljud) spela(this.inst.ljud);
    }
    if (this.kvar <= 0) {
      this.tom = true;
      this.vidTom();
    }
    this.rita();
  }

  private rita(): void {
    const { x, y, r } = this.inst;
    const andel = this.kvar / (this.inst.sekunder * 1000);
    const g = this.g.clear();
    g.fillStyle(farg.morkgron, 1).fillRect(x - 4, y - r - 9, 8, 7).fillRect(x - 7, y - r - 12, 14, 4);
    g.fillStyle(farg.ljusbeige, 1).fillCircle(x, y, r);
    if (andel > 0) {
      g.fillStyle(this.igang ? farg.guld : farg.beige, 1);
      g.slice(x, y, r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * andel, false);
      g.fillPath();
    }
    g.lineStyle(3, farg.morkgron, 1).strokeCircle(x, y, r);
    // Visaren pekar på kanten av det som är kvar.
    const v = -Math.PI / 2 + Math.PI * 2 * andel;
    g.lineStyle(2, farg.morkgron, 1).lineBetween(x, y, x + Math.cos(v) * (r - 5), y + Math.sin(v) * (r - 5));
    g.fillStyle(farg.morkgron, 1).fillCircle(x, y, 3);
  }
}

interface KnappObjekt {
  data: VillkoradKnapp;
  c: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  etikett: Phaser.GameObjects.Text;
  forklaring: Phaser.GameObjects.Text;
  /** Senast ritade läge: "" = aktiv, annars förklaringen. */
  lage: string | null;
}

const KNAPP_H = 50;

/** Villkorade knappar: ritas om bara när läget ändras. */
export class VillkoradeKnappar {
  private knappar: KnappObjekt[];
  private avstangd = false;

  constructor(
    private scene: Phaser.Scene,
    lista: VillkoradKnapp[],
    private harFlagga: (namn: string) => boolean,
    private tryck: (k: VillkoradKnapp) => void,
  ) {
    this.knappar = lista.map((data) => {
      const bg = scene.add.graphics();
      const etikett = skapaText(scene, 0, -6, data.text, 'knapp', 'morkgron', { origo: [0.5, 0.5], storlek: 15 });
      const forklaring = skapaText(scene, 0, 13, '', 'liten', 'ljusbeige', { origo: [0.5, 0.5], storlek: 11 });
      const c = scene.add.container(data.x, data.y, [bg, etikett, forklaring]).setDepth(30).setSize(data.b, KNAPP_H);
      c.setInteractive({ useHandCursor: true });
      const k: KnappObjekt = { data, c, bg, etikett, forklaring, lage: null };
      c.on('pointerup', () => {
        if (this.avstangd || k.lage !== '') return;
        this.scene.tweens.add({ targets: c, scale: 0.94, duration: 70, yoyo: true });
        this.tryck(data);
      });
      return k;
    });
    this.uppdatera();
  }

  /** Förklaringen från det första villkoret som inte är uppfyllt, eller "" om knappen är aktiv. */
  private lage(k: VillkoradKnapp): string {
    for (const v of k.villkor) {
      if (v.krav && !v.krav.some((f) => this.harFlagga(f))) return v.annars;
      if (v.inte && this.harFlagga(v.inte)) return v.annars;
    }
    return '';
  }

  uppdatera(): void {
    for (const k of this.knappar) {
      const lage = this.avstangd ? (k.lage ?? '') : this.lage(k.data);
      if (lage === k.lage) continue;
      k.lage = lage;
      this.rita(k);
    }
  }

  /** Alla knappar slutar svara (nivån är avgjord). */
  stang(): void {
    this.avstangd = true;
    for (const k of this.knappar) k.c.disableInteractive();
  }

  private rita(k: KnappObjekt): void {
    const { b } = k.data;
    const aktiv = k.lage === '';
    const guld = (k.data.variant ?? 'guld') === 'guld';
    k.bg.clear();
    if (guld) k.bg.fillStyle(farg.guld, 1).fillRoundedRect(-b / 2, -KNAPP_H / 2, b, KNAPP_H, radie.l);
    else {
      k.bg.fillStyle(farg.morkgron, 1).fillRoundedRect(-b / 2, -KNAPP_H / 2, b, KNAPP_H, radie.l);
      k.bg.lineStyle(1.5, farg.ljusbeige, 1).strokeRoundedRect(-b / 2, -KNAPP_H / 2, b, KNAPP_H, radie.l);
    }
    k.etikett.setColor(css(guld ? 'morkgron' : 'ljusbeige')).setY(aktiv ? 0 : -7);
    k.forklaring.setText(aktiv ? '' : (k.lage ?? '')).setColor(css(guld ? 'morkgron' : 'ljusbeige'));
    k.c.setAlpha(aktiv ? 1 : 0.45);
    if (aktiv) this.scene.tweens.add({ targets: k.c, scale: 1.05, duration: 140, yoyo: true });
  }
}
