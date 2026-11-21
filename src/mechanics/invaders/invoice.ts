/**
 * Fakturan i invaders (t.ex. Friskvårdskursen, fas 2): en stor beige faktura överst som en boss. Varje rad är en
 * livsstapel med sitt belopp; "Summa att betala" längst ner räknas ner när avdrag görs. Summan kan aldrig gå under
 * golvet (raderna minus alla avdrag som finns i fasen); när golvet nås lyser summan guld.
 * Skott som träffar fakturan studsar (Invaders.ts visar studsen och texten). Allt styrs av "faktura" i nivåfilen.
 */
import Phaser from 'phaser';
import { farg, radie } from '../../config/theme';
import type { FakturaInstallningar } from '../../core/levelTypes';
import { spela } from '../../core/sound';
import { skapaText } from '../../ui/text';

const DJUP = 9;

interface Rad {
  start: number;
  kvar: number;
  golv: number;
  stapel: Phaser.GameObjects.Graphics;
  belopp: Phaser.GameObjects.Text;
  stapelX: number;
  stapelY: number;
  stapelB: number;
}

/** 10800 -> "10 800 kr" */
function kronor(n: number): string {
  return `${Math.round(n).toLocaleString('sv-SE')} kr`;
}

export class Faktura {
  private rader: Rad[];
  private summaText: Phaser.GameObjects.Text;
  private summaEtikett: Phaser.GameObjects.Text;
  private visadSumma: number;
  private glod: Phaser.GameObjects.Graphics;
  private vidGolv = false;
  private c: Phaser.GameObjects.Container;

  /** arv: räknare från tidigare faser (för rader med perArv). avdragPerRad: alla avdrag som finns i fasen, per rad. */
  constructor(
    private scene: Phaser.Scene,
    private inst: FakturaInstallningar,
    arv: Record<string, number>,
    avdragPerRad: number[],
  ) {
    const { b, h } = inst;
    const l = -b / 2;
    const t = -h / 2;
    this.c = scene.add.container(inst.x, inst.y).setDepth(DJUP);
    const g = scene.add.graphics();
    g.fillStyle(farg.beige, 1).fillRoundedRect(l, t, b, h, radie.m);
    g.lineStyle(1.5, farg.guld, 1).strokeRoundedRect(l, t, b, h, radie.m);
    g.fillStyle(farg.guld, 1).fillRect(l, t + 34, b, 2);
    this.c.add(g);
    this.c.add(skapaText(scene, l + 16, t + 18, inst.rubrik, 'overrubrik', 'morkockra', { origo: [0, 0.5], storlek: 12 }));

    const radH = (h - 34 - 64) / Math.max(1, inst.rader.length);
    this.rader = inst.rader.map((r, i) => {
      const start = r.belopp ?? (r.perArv ? (arv[r.perArv.raknare] ?? 0) * r.perArv.belopp : 0);
      const ry = t + 42 + i * radH;
      this.c.add(skapaText(scene, l + 16, ry + 8, r.etikett, 'brod', 'morkgron', { origo: [0, 0.5], storlek: 13 }));
      const belopp = skapaText(scene, -l - 16, ry + 8, kronor(start), 'knapp', 'morkgron', { origo: [1, 0.5], storlek: 13 });
      const stapel = scene.add.graphics();
      this.c.add([belopp, stapel]);
      const rad: Rad = {
        start,
        kvar: start,
        golv: Math.max(0, start - (avdragPerRad[i] ?? 0)),
        stapel,
        belopp,
        stapelX: l + 16,
        stapelY: ry + 22,
        stapelB: b - 32,
      };
      this.ritaStapel(rad);
      return rad;
    });

    // Summan längst ner.
    const sy = t + h - 32;
    g.lineStyle(1, farg.morkgron, 0.4).lineBetween(l + 16, sy - 22, -l - 16, sy - 22);
    this.glod = scene.add.graphics().setAlpha(0);
    this.glod.fillStyle(farg.guld, 1).fillRoundedRect(l + 8, sy - 18, b - 16, 36, 10);
    this.summaEtikett = skapaText(scene, l + 16, sy, inst.summaEtikett, 'rubrik', 'morkgron', { origo: [0, 0.5], storlek: 17 });
    this.visadSumma = this.summa();
    this.summaText = skapaText(scene, -l - 16, sy, kronor(this.visadSumma), 'rubrik', 'morkgron', { origo: [1, 0.5], storlek: 20 });
    this.c.add([this.glod, this.summaEtikett, this.summaText]);

    // Fakturan dyker upp.
    this.c.setAlpha(0).setScale(0.85);
    scene.tweens.add({ targets: this.c, alpha: 1, scale: 1, duration: 420, ease: 'Back.easeOut' });
    if (inst.ljud) spela(inst.ljud);
  }

  /** Summan just nu (alla rader). */
  summa(): number {
    return this.rader.reduce((s, r) => s + r.kvar, 0);
  }

  /** Golvet: raderna minus alla avdrag som finns i fasen. */
  golv(): number {
    return this.rader.reduce((s, r) => s + r.golv, 0);
  }

  /** Drar av belopp från rad (index). Raden går inte under sitt golv. Summan räknas ner. */
  dra(rad: number, belopp: number): void {
    const r = this.rader[rad];
    if (!r) return;
    r.kvar = Math.max(r.golv, r.kvar - belopp);
    r.belopp.setText(kronor(r.kvar));
    this.ritaStapel(r);
    const fran = this.visadSumma;
    const till = this.summa();
    this.scene.tweens.addCounter({
      from: fran,
      to: till,
      duration: 500,
      onUpdate: (tw) => {
        this.visadSumma = tw.getValue() ?? till;
        this.summaText.setText(kronor(this.visadSumma));
      },
    });
    if (!this.vidGolv && till <= this.golv()) {
      // Alla avdrag gjorda: summan lyser guld.
      this.vidGolv = true;
      this.scene.tweens.add({ targets: this.glod, alpha: 1, duration: 400 });
    }
  }

  /** Sant om punkten ligger på fakturan. */
  traff(x: number, y: number): boolean {
    const { b, h } = this.inst;
    return Math.abs(x - this.inst.x) <= b / 2 && Math.abs(y - this.inst.y) <= h / 2;
  }

  /** Fakturans underkant, för siktlinjen. */
  nedersta(): number {
    return this.inst.y + this.inst.h / 2;
  }

  /** Fakturan skakar till när ett skott studsar. */
  skaka(): void {
    const x = this.inst.x;
    this.scene.tweens.add({ targets: this.c, x: x + 3, duration: 45, yoyo: true, repeat: 1, onComplete: () => this.c.setX(x) });
  }

  private ritaStapel(r: Rad): void {
    const andel = r.start > 0 ? r.kvar / r.start : 0;
    r.stapel.clear();
    r.stapel.fillStyle(farg.ljusbeige, 1).fillRoundedRect(r.stapelX, r.stapelY, r.stapelB, 8, 4);
    if (andel > 0) r.stapel.fillStyle(farg.vinrod, 1).fillRoundedRect(r.stapelX, r.stapelY, Math.max(8, r.stapelB * andel), 8, 4);
  }
}
