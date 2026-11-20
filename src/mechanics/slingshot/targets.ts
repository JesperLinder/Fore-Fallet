/**
 * Studsmål för slangbella i sidovy (objekt av typen "studsmal"): fasta mål som stöter bort projektilen och säger
 * något, kan skicka den i en båge mot ett annat mål, och kan vara slutmål med en scriptad händelse – projektilen
 * stämplas och flyger av sig själv i en båge till ett annat mål, som svarar, och något i scenen lyser upp.
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import { BREDD } from '../../config/display';
import type { Niva, Slutmal, StudsmalObjekt } from '../../core/levelTypes';
import { spela } from '../../core/sound';
import { skapaText } from '../../ui/text';
import { talbubbla } from '../../ui/Badge';
import { ritaFigur } from '../art';
import { MATTER_G } from './flight';
import type { MatterKropp } from './launcher';

const DJUP = 3.5;
/** Antal fysiksteg som en omdirigerad projektil tar till sitt nya mål. */
const MOT_STEG = 42;

export class Studsmal {
  private mal = new Map<number, StudsmalObjekt>();
  private perId = new Map<string, StudsmalObjekt>();

  constructor(
    private scene: Phaser.Scene,
    niva: Niva,
    private gravitation: number,
  ) {
    for (const o of niva.objekt) {
      if (o.typ !== 'studsmal') continue;
      const kropp = scene.matter.add.rectangle(o.x, o.y, o.b, o.h, { isStatic: true, label: 'studsmal', restitution: 0.75, friction: 0.1 });
      this.mal.set(kropp.id, o);
      this.perId.set(o.id, o);
      const g = scene.add.graphics().setDepth(DJUP);
      ritaFigur(g, o.utseende, o.x, o.y, o.b, o.h);
      if (o.etikett) {
        skapaText(scene, o.x, o.y - o.h / 2 - 12, o.etikett, 'knapp', o.etikettFarg ?? 'morkgron', { origo: [0.5, 0.5], storlek: 11 }).setDepth(DJUP);
      }
    }
  }

  hamta(kropp: MatterKropp): StudsmalObjekt | undefined {
    return this.mal.get(kropp.id);
  }

  /** Pratbubbla ovanför ett mål i 2,5 sekunder. */
  saga(id: string, text: string): void {
    const m = this.perId.get(id);
    if (!m) return;
    const x = Phaser.Math.Clamp(m.x, 140, BREDD - 140);
    const b = talbubbla(this.scene, x, m.y - m.h / 2 - 22, text).setDepth(25).setAlpha(0);
    this.scene.tweens.add({ targets: b, alpha: 1, duration: 180 });
    this.scene.tweens.add({ targets: b, alpha: 0, delay: 2500, duration: 300, onComplete: () => b.destroy() });
  }

  /**
   * Hastighet (punkter per steg) som får en projektil från "fran" att landa på målet "id" efter MOT_STEG steg,
   * med samma gravitation som Matter använder (hastighet += g varje steg).
   */
  riktaMot(id: string, fran: { x: number; y: number }): { x: number; y: number } | undefined {
    const m = this.perId.get(id);
    if (!m) return undefined;
    const g = this.gravitation * MATTER_G;
    const t = MOT_STEG;
    return { x: (m.x - fran.x) / t, y: (m.y - fran.y - (g * t * (t + 1)) / 2) / t };
  }

  /**
   * Den scriptade händelsen: projektilen (figur) stämplas vid slutmålet, flyger i en båge till mottagaren,
   * som svarar, och "lys" tonas in. klar() anropas när allt är över.
   */
  spelaSlut(fran: StudsmalObjekt, slut: Slutmal, projektil: string, klar: () => void): void {
    const till = this.perId.get(slut.till);
    if (!till) return klar();
    const akt = this.scene.add.container(fran.x, fran.y).setDepth(22);
    const g = this.scene.add.graphics();
    ritaFigur(g, projektil, 0, 0);
    akt.add(g);
    akt.setScale(1.4);

    const flyg = () => {
      const start = new Phaser.Math.Vector2(akt.x, akt.y);
      const slutpunkt = new Phaser.Math.Vector2(till.x, till.y - till.h / 2 + 6);
      const topp = new Phaser.Math.Vector2((start.x + slutpunkt.x) / 2, slut.topp);
      const kurva = new Phaser.Curves.QuadraticBezier(start, topp, slutpunkt);
      const f = { t: 0 };
      this.scene.tweens.add({
        targets: f,
        t: 1,
        duration: slut.tid,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          const p = kurva.getPoint(f.t);
          akt.setPosition(p.x, p.y).setAngle(f.t * 360);
        },
        onComplete: () => this.landa(akt, till, slut, klar),
      });
    };

    if (!slut.stampel) return flyg();
    // Stämpeln: en guldruta med texten slås ner på akten.
    const st = skapaText(this.scene, 0, 0, slut.stampel, 'overrubrik', 'morkgron', { origo: [0.5, 0.5], storlek: 9 });
    const ram = this.scene.add.graphics().fillStyle(farg.guld, 1).fillRoundedRect(-st.width / 2 - 6, -9, st.width + 12, 18, 4);
    const stampel = this.scene.add.container(0, 0, [ram, st]).setAngle(-12).setScale(2.4).setAlpha(0);
    akt.add(stampel);
    this.scene.tweens.add({
      targets: stampel,
      scale: 0.6,
      alpha: 1,
      duration: 220,
      delay: 250,
      ease: 'Quad.easeIn',
      onComplete: () => {
        spela('stampel');
        this.scene.time.delayedCall(600, flyg);
      },
    });
  }

  private landa(akt: Phaser.GameObjects.Container, till: StudsmalObjekt, slut: Slutmal, klar: () => void): void {
    akt.setAngle(0);
    this.scene.tweens.add({ targets: akt, scale: 0.9, duration: 160, yoyo: true });
    spela('jubel');
    if (slut.svar) this.saga(till.id, slut.svar);
    if (slut.lys) {
      const l = slut.lys;
      const g = this.scene.add.graphics().setDepth(DJUP + 0.1).setAlpha(0);
      ritaFigur(g, l.utseende, l.x, l.y, l.b, l.h);
      this.scene.tweens.add({ targets: g, alpha: 1, duration: 500, delay: 200 });
    }
    this.scene.time.delayedCall(2400, klar);
  }
}
