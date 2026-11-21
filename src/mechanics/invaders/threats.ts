/**
 * Fallande hot i invaders (t.ex. uppsägningsbrev): släpps uppifrån med jämna mellanrum, ska skjutas
 * ner innan de når spelaren. Motsatsen till fångstobjekt. Allt styrs av "hot" i nivåfilen.
 *
 * Valfritt: hot i flera sorter (hot.typer) med egna regler vid träff och när de når spelaren, t.ex. besparingar
 * som ska skjutas och kostnadsposter som skottet studsar mot. hot.antal anger hur många av varje sort som släpps,
 * i slumpad ordning. Utan typer fungerar hoten exakt som förut.
 */
import Phaser from 'phaser';
import { BREDD } from '../../config/display';
import { arMork, avstand, farg } from '../../config/theme';
import type { HotInstallningar, HotTyp } from '../../core/levelTypes';
import { pratbubbla } from '../../ui/Badge';
import { skapaText } from '../../ui/text';
import { ritaFigur } from '../art';

interface Hot {
  obj: Phaser.GameObjects.Container;
  /** Sorten (bara med hot.typer). */
  typ?: HotTyp;
  b: number;
  h: number;
}

/** Ett hot som träffats eller nått spelaren: var, och vilken sort (med hot.typer). */
export interface HotHandelse {
  x: number;
  y: number;
  typ?: HotTyp;
}

/** Med etiketter under objektet: så här mycket plats i sidled (texten bryts på två rader). */
const ETIKETT_B = 150;

export class FallandeHot {
  private aktiva: Hot[] = [];
  private tillNasta: number;
  private antal = 0;
  /** Med hot.typer: sorterna som återstår att släppa, i slumpad ordning. */
  private ko: string[] | null = null;

  /** kallor: var hoten kan släppas ifrån ("fran-fiende"), t.ex. ufonas positioner just nu. */
  constructor(
    private scene: Phaser.Scene,
    private inst: HotInstallningar,
    private kallor: () => Phaser.Math.Vector2[],
  ) {
    this.tillNasta = inst.fordrojning ?? inst.intervall;
    if (inst.typer) {
      const antal = inst.antal ?? Object.fromEntries(Object.keys(inst.typer).map((k) => [k, 1]));
      this.ko = Phaser.Utils.Array.Shuffle(Object.entries(antal).flatMap(([typ, n]) => Array<string>(n).fill(typ)));
    }
  }

  /**
   * Släpper nya hot och flyttar de aktiva. forlopp (0–1) = hur långt nivån kommit, för tempoökningen.
   * Returnerar varje hot som nådde linjen (spelaren) i detta steg.
   */
  uppdatera(dt: number, forlopp: number, linje: number): HotHandelse[] {
    this.tillNasta -= dt;
    if (this.tillNasta <= 0) {
      this.slapp();
      const slut = this.inst.slutIntervall ?? this.inst.intervall;
      this.tillNasta += Phaser.Math.Linear(this.inst.intervall, slut, Phaser.Math.Clamp(forlopp, 0, 1));
    }
    const nadde: HotHandelse[] = [];
    const dy = (this.inst.fart * dt) / 1000;
    this.aktiva = this.aktiva.filter((h) => {
      h.obj.y += dy;
      if (h.obj.y + h.h / 2 < linje) return true;
      nadde.push({ x: h.obj.x, y: h.obj.y, typ: h.typ });
      this.scene.tweens.add({ targets: h.obj, alpha: 0, y: h.obj.y + 20, duration: 250, onComplete: () => h.obj.destroy() });
      return false;
    });
    return nadde;
  }

  /**
   * Träffar skottet ett hot tas det bort (utom sorter med vidTraff.studsa, som ligger kvar).
   * Returnerar träffen, eller undefined om skottet inte träffade något hot.
   */
  traff(x: number, y: number): HotHandelse | undefined {
    const i = this.aktiva.findIndex((h) => Math.abs(x - h.obj.x) <= h.b / 2 + 3 && Math.abs(y - h.obj.y) <= h.h / 2);
    if (i < 0) return undefined;
    const h = this.aktiva[i];
    const traff = { x: h.obj.x, y: h.obj.y, typ: h.typ };
    if (h.typ?.vidTraff?.studsa) {
      // Skottet studsar: objektet skakar till och ligger kvar.
      const x0 = h.obj.x;
      this.scene.tweens.add({ targets: h.obj, x: x0 + 4, duration: 50, yoyo: true, repeat: 1, onComplete: () => h.obj.setX(x0) });
      return traff;
    }
    this.aktiva.splice(i, 1);
    this.scene.tweens.add({ targets: h.obj, scale: 1.3, alpha: 0, angle: 15, duration: 180, onComplete: () => h.obj.destroy() });
    return traff;
  }

  /** Översta kanten på det lägsta aktiva hotet, för siktlinjen. */
  nedersta(): number {
    return this.aktiva.reduce((max, h) => Math.max(max, h.obj.y + h.h / 2), 0);
  }

  stoppa(): void {
    this.aktiva.forEach((h) => h.obj.destroy());
    this.aktiva = [];
    if (this.ko) this.ko = [];
  }

  private slapp(): void {
    if (this.ko) {
      const namn = this.ko.shift();
      const typ = namn ? this.inst.typer?.[namn] : undefined;
      if (typ) this.slappTyp(typ);
      return;
    }
    const { b, h } = this.inst;
    let x: number;
    let y: number;
    const kallor = this.kallor();
    if (this.inst.fran) {
      // Från en punkt (t.ex. bossen), spridda i sidled.
      x = this.inst.fran.x + Phaser.Math.Between(-this.inst.fran.spridning, this.inst.fran.spridning);
      y = this.inst.fran.y;
    } else if (this.inst.start === 'fran-fiende' && kallor.length > 0) {
      const k = Phaser.Utils.Array.GetRandom(kallor);
      x = k.x;
      y = k.y + 18;
    } else {
      x = Phaser.Math.Between(avstand.l + b, BREDD - avstand.l - b);
      y = this.inst.y ?? 180;
    }
    const g = this.scene.add.graphics();
    ritaFigur(g, this.inst.utseende, 0, 0, b, h);
    const obj = this.scene.add.container(x, y, [g]).setDepth(13);
    const visa = this.inst.etikett && (this.inst.visaEtikett === 'alltid' || this.antal === 0);
    if (visa && this.inst.etikett) {
      const etikett = pratbubbla(this.scene, 0, h / 2 + 16, `${this.inst.etikett} ↓`, 'vinrod', 'ljusbeige');
      this.scene.children.remove(etikett);
      obj.add(etikett);
    }
    this.antal += 1;
    this.aktiva.push({ obj, b, h });
  }

  /** Ett hot av en viss sort (hot.typer): figuren, och etiketten under objektet (eller på det, med etikettY). */
  private slappTyp(typ: HotTyp): void {
    const pa = typ.etikettY !== undefined;
    const marginal = Math.max(typ.b / 2, typ.etiketter?.length && !pa ? ETIKETT_B / 2 : 0) + 4;
    const x = Phaser.Math.Between(avstand.l + marginal, BREDD - avstand.l - marginal);
    const g = this.scene.add.graphics();
    ritaFigur(g, typ.utseende, 0, 0, typ.b, typ.h, typ.farg ? farg[typ.farg] : undefined);
    const obj = this.scene.add.container(x, this.inst.y ?? 180, [g]).setDepth(13);
    if (typ.etiketter?.length) {
      const textFarg = typ.etikettFarg ?? (typ.farg && arMork(typ.farg) ? 'ljusbeige' : 'beige');
      const t = skapaText(this.scene, 0, pa ? (typ.etikettY ?? 0) : typ.h / 2 + 4, Phaser.Utils.Array.GetRandom(typ.etiketter), 'knapp', textFarg, {
        origo: [0.5, pa ? 0.5 : 0],
        storlek: 11,
        bredd: pa ? typ.b - 10 : ETIKETT_B,
        justering: 'center',
      });
      obj.add(t);
    }
    obj.setAlpha(0);
    this.scene.tweens.add({ targets: obj, alpha: 1, duration: 200 });
    this.antal += 1;
    this.aktiva.push({ obj, typ, b: typ.b, h: typ.h });
  }
}
