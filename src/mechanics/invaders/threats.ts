/**
 * Fallande hot i invaders (t.ex. uppsägningsbrev): släpps uppifrån med jämna mellanrum, ska skjutas
 * ner innan de når spelaren. Motsatsen till fångstobjekt. Allt styrs av "hot" i nivåfilen.
 */
import Phaser from 'phaser';
import { BREDD } from '../../config/display';
import { avstand } from '../../config/theme';
import type { HotInstallningar } from '../../core/levelTypes';
import { pratbubbla } from '../../ui/Badge';
import { ritaFigur } from '../art';

interface Hot {
  obj: Phaser.GameObjects.Container;
}

export class FallandeHot {
  private aktiva: Hot[] = [];
  private tillNasta: number;
  private antal = 0;

  /** kallor: var hoten kan släppas ifrån ("fran-fiende"), t.ex. ufonas positioner just nu. */
  constructor(
    private scene: Phaser.Scene,
    private inst: HotInstallningar,
    private kallor: () => Phaser.Math.Vector2[],
  ) {
    this.tillNasta = inst.fordrojning ?? inst.intervall;
  }

  /**
   * Släpper nya hot och flyttar de aktiva. forlopp (0–1) = hur långt nivån kommit, för tempoökningen.
   * Returnerar x för varje hot som nådde linjen (spelaren) i detta steg.
   */
  uppdatera(dt: number, forlopp: number, linje: number): number[] {
    this.tillNasta -= dt;
    if (this.tillNasta <= 0) {
      this.slapp();
      const slut = this.inst.slutIntervall ?? this.inst.intervall;
      this.tillNasta += Phaser.Math.Linear(this.inst.intervall, slut, Phaser.Math.Clamp(forlopp, 0, 1));
    }
    const nadde: number[] = [];
    const dy = (this.inst.fart * dt) / 1000;
    this.aktiva = this.aktiva.filter((h) => {
      h.obj.y += dy;
      if (h.obj.y + this.inst.h / 2 < linje) return true;
      nadde.push(h.obj.x);
      this.scene.tweens.add({ targets: h.obj, alpha: 0, y: h.obj.y + 20, duration: 250, onComplete: () => h.obj.destroy() });
      return false;
    });
    return nadde;
  }

  /** Träffar skottet ett hot tas det bort. */
  traff(x: number, y: number): boolean {
    const i = this.aktiva.findIndex((h) => Math.abs(x - h.obj.x) <= this.inst.b / 2 + 3 && Math.abs(y - h.obj.y) <= this.inst.h / 2);
    if (i < 0) return false;
    const [h] = this.aktiva.splice(i, 1);
    this.scene.tweens.add({ targets: h.obj, scale: 1.3, alpha: 0, angle: 15, duration: 180, onComplete: () => h.obj.destroy() });
    return true;
  }

  /** Översta kanten på det lägsta aktiva hotet, för siktlinjen. */
  nedersta(): number {
    return this.aktiva.reduce((max, h) => Math.max(max, h.obj.y + this.inst.h / 2), 0);
  }

  stoppa(): void {
    this.aktiva.forEach((h) => h.obj.destroy());
    this.aktiva = [];
  }

  private slapp(): void {
    const { b, h } = this.inst;
    let x: number;
    let y: number;
    const kallor = this.kallor();
    if (this.inst.start === 'fran-fiende' && kallor.length > 0) {
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
    this.aktiva.push({ obj });
  }
}
