/**
 * Kulisser och engångshändelser i invaders:
 * - Kulisser: fasta figurer (art.ts) och texter bakom spelet, t.ex. pumpar, hinkar och en kassadisk.
 * - Bakgrund "vag": en väg i höjdled vars streckade mittlinje rullar nedåt.
 * - Engångshändelser: en följd av steg som spelas upp en gång vid en viss tid, t.ex. en skugga som häller
 *   något i en hink och en bil som kommer fram. Spelaren kan inte påverka dem.
 * Allt styrs från nivåfilen ("kulisser", "bakgrund", "handelser"). Tiden går bara medan nivån pågår.
 */
import Phaser from 'phaser';
import { BREDD, HOJD } from '../../config/display';
import { farg, type FargNamn } from '../../config/theme';
import type { Engangshandelse, HandelseSteg, InvadersInstallningar, Kulisse } from '../../core/levelTypes';
import { spela } from '../../core/sound';
import { talbubbla } from '../../ui/Badge';
import { skapaText } from '../../ui/text';
import { ritaFigur } from '../art';

const DJUP_BAKOM = 2;
/** Framför spelaren (djup 20) men under pratbubblorna. */
const DJUP_FRAM = 21;
const DJUP_HANDELSE = 6;

/** Ritar kulisserna och returnerar deras behållare (i samma ordning). */
export function ritaKulisser(scene: Phaser.Scene, kulisser: Kulisse[]): Phaser.GameObjects.Container[] {
  return kulisser.map((k) => ritaKulisse(scene, k));
}

/** Ritar en kulisse i en behållare med mittpunkten i (x, y), så att den kan tonas eller skalas in (t.ex. en etapp). */
export function ritaKulisse(scene: Phaser.Scene, k: Kulisse): Phaser.GameObjects.Container {
  const c = scene.add.container(k.x, k.y).setDepth(k.fram ? DJUP_FRAM : DJUP_BAKOM);
  if (k.utseende) {
    const g = scene.add.graphics();
    ritaFigur(g, k.utseende, 0, 0, k.b ?? 0, k.h ?? 0, k.farg ? farg[k.farg] : undefined);
    c.add(g);
  }
  if (k.text) {
    c.add(
      skapaText(scene, 0, k.textY ?? 0, k.text, 'knapp', k.textFarg ?? 'morkgron', {
        origo: [0.5, 0.5],
        storlek: k.textStorlek ?? 11,
        justering: 'center',
      }),
    );
  }
  return c;
}

/** Talbubbla med spetsen i (x, y) som visas i langd ms. Hålls inom skärmen. */
export function visaTalbubbla(scene: Phaser.Scene, x: number, y: number, innehall: string, bakgrund: FargNamn, textFarg: FargNamn, langd: number): void {
  const p = talbubbla(scene, 0, 0, innehall, bakgrund, textFarg).setDepth(40);
  const halv = p.getBounds().width / 2 + 8;
  p.setPosition(Phaser.Math.Clamp(x, halv, BREDD - halv), y).setScale(0.6);
  scene.tweens.add({ targets: p, scale: 1, duration: 220, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: p, alpha: 0, delay: Math.max(0, langd - 400), duration: 400, onComplete: () => p.destroy() });
}

const STRECK = 28;
const LUCKA = 24;

/** Vägen: en bred yta med kanter och en streckad mittlinje som rullar nedåt. */
export class RullandeVag {
  private linje: Phaser.GameObjects.Graphics;
  private forskjutning = 0;

  constructor(
    scene: Phaser.Scene,
    private v: NonNullable<InvadersInstallningar['bakgrund']>,
  ) {
    const g = scene.add.graphics().setDepth(1);
    g.fillStyle(farg.gron, 1).fillRect(v.x - v.b / 2, v.topp, v.b, HOJD - v.topp);
    g.fillStyle(farg.beige, 0.5).fillRect(v.x - v.b / 2 + 6, v.topp, 2, HOJD - v.topp).fillRect(v.x + v.b / 2 - 8, v.topp, 2, HOJD - v.topp);
    this.linje = scene.add.graphics().setDepth(1);
    this.rita();
  }

  uppdatera(dt: number): void {
    this.forskjutning = (this.forskjutning + (this.v.fart * dt) / 1000) % (STRECK + LUCKA);
    this.rita();
  }

  private rita(): void {
    const { x, topp } = this.v;
    this.linje.clear().fillStyle(farg.beige, 0.8);
    for (let y = topp - STRECK - LUCKA + this.forskjutning; y < HOJD; y += STRECK + LUCKA) {
      const y0 = Math.max(topp, y);
      const y1 = Math.min(HOJD, y + STRECK);
      if (y1 > y0) this.linje.fillRect(x - 2, y0, 4, y1 - y0);
    }
  }
}

interface Spelning {
  h: Engangshandelse;
  /** Nästa steg som ska börja, och när (ms från nivåns start). */
  i: number;
  nasta: number;
}

interface Bubbelkalla {
  x: number;
  y: number;
  farg: number;
  kvar: number;
  tillNasta: number;
}

const BUBBLA_MS = 70;

/** Djup för det som visas i en scriptad avslutning: över spelplanen och spelaren. */
const DJUP_SLUT = 35;

export class Engangshandelser {
  private tid = 0;
  private spelningar: Spelning[];
  private figurer = new Map<string, Phaser.GameObjects.Graphics>();
  /** Storlek per figur-id, så att steget "byt" ritar den nya figuren lika stor. */
  private storlek = new Map<string, [number, number]>();
  private bubblor: Bubbelkalla[] = [];

  /** hjalp: hur stegen "flagga" och "text" utförs (sätts av Invaders.ts). */
  constructor(
    private scene: Phaser.Scene,
    lista: Engangshandelse[],
    private hjalp?: { flagga: (namn: string) => void; text: (text: string, y?: number, farg?: FargNamn, textFarg?: FargNamn) => void },
  ) {
    // Händelser med start "vinst" väntar tills startaVinst() anropas.
    this.spelningar = lista.map((h) => ({ h, i: 0, nasta: h.start === 'vinst' ? Infinity : h.start }));
  }

  /** Gör en kulisse (dess grafik, ritad kring (0, 0)) åtkomlig för steget "byt" under sitt id. */
  registrera(id: string, g: Phaser.GameObjects.Graphics, b = 0, h = 0): void {
    this.figurer.set(id, g);
    this.storlek.set(id, [b, h]);
  }

  /** Sant om någon händelse ska spelas vid vinst, och om den går att hoppa över. */
  harVinst(): boolean {
    return this.spelningar.some((s) => s.h.start === 'vinst');
  }

  kanHoppas(): boolean {
    return this.spelningar.some((s) => s.h.start === 'vinst' && s.h.hoppaOver);
  }

  /** Startar händelserna med start "vinst". Returnerar hur länge de pågår (ms). */
  startaVinst(): number {
    let langst = 0;
    for (const s of this.spelningar) {
      if (s.h.start !== 'vinst') continue;
      s.nasta = this.tid;
      let t = 0;
      for (const steg of s.h.steg) {
        langst = Math.max(langst, t + steg.langd);
        t += steg.efter ?? steg.langd;
      }
    }
    return langst;
  }

  uppdatera(dt: number): void {
    this.tid += dt;
    for (const s of this.spelningar) {
      while (s.i < s.h.steg.length && this.tid >= s.nasta) {
        const steg = s.h.steg[s.i++];
        s.nasta += steg.efter ?? steg.langd;
        this.kor(steg);
      }
    }
    this.bubblor = this.bubblor.filter((k) => {
      k.kvar -= dt;
      k.tillNasta -= dt;
      if (k.tillNasta <= 0) {
        k.tillNasta += BUBBLA_MS;
        this.bubbla(k);
      }
      return k.kvar > 0;
    });
  }

  private kor(steg: HandelseSteg): void {
    if (steg.ljud) spela(steg.ljud);
    switch (steg.gor) {
      case 'in': {
        const g = this.scene.add.graphics({ x: steg.fran[0], y: steg.fran[1] }).setDepth(DJUP_HANDELSE);
        ritaFigur(g, steg.utseende, 0, 0, steg.b ?? 0, steg.h ?? 0);
        this.figurer.set(steg.id, g);
        this.scene.tweens.add({ targets: g, x: steg.till[0], y: steg.till[1], duration: steg.langd, ease: 'Sine.easeInOut' });
        break;
      }
      case 'ut': {
        const g = this.figurer.get(steg.id);
        if (!g) break;
        this.figurer.delete(steg.id);
        this.scene.tweens.add({ targets: g, x: steg.till[0], y: steg.till[1], duration: steg.langd, ease: 'Sine.easeIn', onComplete: () => g.destroy() });
        break;
      }
      case 'vicka': {
        const g = this.figurer.get(steg.id);
        if (!g) break;
        const x = g.x;
        const varv = Math.max(1, Math.round(steg.langd / 240));
        this.scene.tweens.add({ targets: g, x: x + 4, duration: 120, yoyo: true, repeat: varv - 1, onComplete: () => g.setX(x) });
        break;
      }
      case 'bubblor': {
        const f = farg[steg.farg];
        if (steg.flack) {
          const flack = this.scene.add.graphics().setDepth(DJUP_HANDELSE).setAlpha(0);
          flack.fillStyle(f, 1).fillEllipse(steg.x, steg.y, steg.flack[0] * 2, steg.flack[1] * 2);
          this.scene.tweens.add({ targets: flack, alpha: 1, duration: 600 });
        }
        this.bubblor.push({ x: steg.x, y: steg.y, farg: f, kvar: steg.langd, tillNasta: 0 });
        break;
      }
      case 'pratbubbla':
        visaTalbubbla(this.scene, steg.x, steg.y, steg.text, steg.farg, steg.textFarg, steg.langd);
        break;
      case 'vanta':
        break;
      case 'flagga':
        this.hjalp?.flagga(steg.namn);
        break;
      case 'text':
        this.hjalp?.text(steg.text, steg.y, steg.farg, steg.textFarg);
        break;
      case 'tona': {
        // Under ringarna från "lys" (djup 22) och det som visas med "visa", över spelplanen och spelaren.
        const sloja = this.scene.add.rectangle(BREDD / 2, (steg.topp + steg.botten) / 2, BREDD, steg.botten - steg.topp, farg[steg.farg ?? 'ljusbeige'], 1);
        sloja.setDepth(21.5).setAlpha(0);
        this.scene.tweens.add({ targets: sloja, alpha: steg.alpha ?? 0.75, duration: steg.langd });
        break;
      }
      case 'lys':
        this.lys(steg.x, steg.y, steg.r ?? 34, farg[steg.farg ?? 'guld'], steg.langd);
        break;
      case 'visa': {
        const [fx, fy] = steg.fran ?? [steg.x, steg.y];
        const g = this.scene.add.graphics({ x: fx, y: fy }).setDepth(DJUP_SLUT).setScale(0.15).setAlpha(0);
        ritaFigur(g, steg.utseende, 0, 0, steg.b ?? 0, steg.h ?? 0);
        const tid = Math.min(500, steg.langd);
        this.scene.tweens.add({ targets: g, x: steg.x, y: steg.y, scale: 1, alpha: 1, duration: tid, ease: 'Back.easeOut' });
        if (steg.id) {
          this.figurer.set(steg.id, g);
          this.storlek.set(steg.id, [steg.b ?? 0, steg.h ?? 0]);
        }
        if (steg.text) {
          const t = skapaText(this.scene, steg.x, steg.y + (steg.textY ?? (steg.h ?? 60) / 2 + 18), steg.text, 'knapp', steg.textFarg ?? 'morkgron', {
            origo: [0.5, 0.5],
            storlek: 14,
            bredd: BREDD - 60,
            justering: 'center',
          }).setDepth(DJUP_SLUT + 1).setAlpha(0);
          const bakom = this.scene.add.graphics().setDepth(DJUP_SLUT).setAlpha(0);
          bakom.fillStyle(farg.ljusbeige, 0.95).fillRoundedRect(t.x - t.width / 2 - 12, t.y - t.height / 2 - 6, t.width + 24, t.height + 12, 12);
          this.scene.tweens.add({ targets: [t, bakom], alpha: 1, delay: tid * 0.7, duration: 250 });
        }
        break;
      }
      case 'byt': {
        const g = this.figurer.get(steg.id);
        if (!g) {
          console.warn(`Händelsen "byt": ingen figur med id "${steg.id}"`);
          break;
        }
        const [b, h] = this.storlek.get(steg.id) ?? [0, 0];
        g.clear();
        ritaFigur(g, steg.utseende, 0, 0, b, h);
        const x = g.x;
        this.scene.tweens.add({ targets: g, x: x + 2, duration: 90, yoyo: true, repeat: 3, onComplete: () => g.setX(x) });
        break;
      }
    }
  }

  /** En ljus ring som pulserar runt (x, y) och tonas bort efter langd ms. */
  private lys(x: number, y: number, r: number, f: number, langd: number): void {
    const g = this.scene.add.graphics({ x, y }).setDepth(22).setAlpha(0);
    g.fillStyle(f, 0.28).fillCircle(0, 0, r);
    g.lineStyle(3, f, 1).strokeCircle(0, 0, r);
    g.lineStyle(1.5, farg.ljusbeige, 0.9).strokeCircle(0, 0, r - 5);
    this.scene.tweens.add({ targets: g, alpha: 1, duration: 200 });
    this.scene.tweens.add({ targets: g, scale: 1.15, duration: 380, yoyo: true, repeat: Math.max(0, Math.round(langd / 760) - 1) });
  }

  private bubbla(k: Bubbelkalla): void {
    const r = Phaser.Math.FloatBetween(3, 6.5);
    const g = this.scene.add.graphics({ x: k.x + Phaser.Math.Between(-10, 10), y: k.y }).setDepth(DJUP_HANDELSE + 1);
    g.fillStyle(k.farg, 1).fillCircle(0, 0, r);
    g.lineStyle(1.2, farg.ljusbeige, 1).strokeCircle(0, 0, r);
    g.fillStyle(farg.ljusbeige, 1).fillCircle(-r * 0.35, -r * 0.35, r * 0.25);
    const tid = Phaser.Math.Between(650, 950);
    this.scene.tweens.add({ targets: g, y: k.y - Phaser.Math.Between(30, 58), x: g.x + Phaser.Math.Between(-6, 6), duration: tid, onComplete: () => g.destroy() });
    // Bubblan syns fullt större delen av vägen och tonas ut på slutet.
    this.scene.tweens.add({ targets: g, alpha: 0, delay: tid * 0.6, duration: tid * 0.4 });
  }
}
