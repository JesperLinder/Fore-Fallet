/**
 * Knapp med rundade hörn. Reagerar på tryck (pointerup) – ingen hover behövs.
 * Minsta tryckyta är alltid 44×44 punkter.
 */
import Phaser from 'phaser';
import { farg, MIN_TRYCKYTA, type FargNamn } from '../config/theme';
import { skapaText } from './text';

export type KnappVariant = 'guld' | 'mork' | 'konturLjus' | 'konturMork';

const STIL: Record<KnappVariant, { fyll?: FargNamn; kontur?: FargNamn; text: FargNamn }> = {
  guld: { fyll: 'guld', text: 'morkgron' },
  mork: { fyll: 'morkgron', text: 'ljusbeige' },
  konturLjus: { kontur: 'morkgron', text: 'morkgron' },
  konturMork: { kontur: 'beige', text: 'beige' },
};

export interface KnappVal {
  bredd: number;
  hojd?: number;
  variant: KnappVariant;
  /** Kallas innan trycket godkänns, t.ex. för att ignorera tryck efter en scrollning. */
  kanTryckas?: () => boolean;
}

export class Knapp extends Phaser.GameObjects.Container {
  private bakgrund: Phaser.GameObjects.Graphics;
  private etikett: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, val: KnappVal, vidTryck: () => void) {
    super(scene, x, y);
    const b = Math.max(val.bredd, MIN_TRYCKYTA);
    const h = Math.max(val.hojd ?? 56, MIN_TRYCKYTA);
    const stil = STIL[val.variant];

    this.bakgrund = scene.add.graphics();
    if (stil.fyll) {
      this.bakgrund.fillStyle(farg[stil.fyll], 1);
      this.bakgrund.fillRoundedRect(-b / 2, -h / 2, b, h, h / 2);
    }
    if (stil.kontur) {
      this.bakgrund.lineStyle(1, farg[stil.kontur], 1);
      this.bakgrund.strokeRoundedRect(-b / 2, -h / 2, b, h, h / 2);
    }
    this.etikett = skapaText(scene, 0, 0, text, 'knapp', stil.text, { origo: [0.5, 0.5] });
    this.add([this.bakgrund, this.etikett]);

    this.setSize(b, h);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => this.setScale(0.97));
    this.on('pointerout', () => this.setScale(1));
    this.on('pointerup', () => {
      this.setScale(1);
      if (val.kanTryckas && !val.kanTryckas()) return;
      vidTryck();
    });
    scene.add.existing(this);
  }
}

/** Rund ikonknapp (t.ex. paus och tillbaka). konturMork är för mörk bakgrund. */
export function ikonKnapp(
  scene: Phaser.Scene,
  x: number,
  y: number,
  variant: 'mork' | 'konturLjus' | 'konturMork',
  ritaIkon: (g: Phaser.GameObjects.Graphics, ikonFarg: number) => void,
  vidTryck: () => void,
): Phaser.GameObjects.Container {
  const r = MIN_TRYCKYTA / 2 + 2;
  const g = scene.add.graphics();
  if (variant === 'mork') {
    g.fillStyle(farg.morkgron, 1).fillCircle(0, 0, r);
  } else {
    g.lineStyle(1, variant === 'konturMork' ? farg.beige : farg.morkgron, 1).strokeCircle(0, 0, r);
  }
  ritaIkon(g, variant === 'konturLjus' ? farg.morkgron : farg.ljusbeige);
  const c = scene.add.container(x, y, [g]).setSize(r * 2, r * 2);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => c.setScale(0.94));
  c.on('pointerout', () => c.setScale(1));
  c.on('pointerup', () => {
    c.setScale(1);
    vidTryck();
  });
  return c;
}

/** Ikon: två pausstreck. */
export function ritaPaus(g: Phaser.GameObjects.Graphics, f: number): void {
  g.fillStyle(f, 1);
  g.fillRoundedRect(-5, -7, 3, 14, 1.5);
  g.fillRoundedRect(2, -7, 3, 14, 1.5);
}

/** Ikon: vinkel åt vänster. */
export function ritaTillbaka(g: Phaser.GameObjects.Graphics, f: number): void {
  g.lineStyle(1.5, f, 1);
  g.beginPath();
  g.moveTo(3, -7);
  g.lineTo(-4, 0);
  g.lineTo(3, 7);
  g.strokePath();
}

/** Ikon: högtalare, med ljudvågor när ljudet är på och ett kryss när det är av. */
export function ritaLjud(pa: boolean) {
  return (g: Phaser.GameObjects.Graphics, f: number): void => {
    g.fillStyle(f, 1);
    g.fillRect(-8, -3, 4, 6);
    g.fillTriangle(-4, -3, 1, -7, 1, 7);
    g.fillTriangle(-4, -3, -4, 3, 1, 7);
    g.lineStyle(1.5, f, 1);
    if (pa) {
      g.beginPath();
      g.arc(1, 0, 5, -0.8, 0.8);
      g.strokePath();
      g.beginPath();
      g.arc(1, 0, 9, -0.8, 0.8);
      g.strokePath();
    } else {
      g.lineBetween(4, -4, 10, 4);
      g.lineBetween(10, -4, 4, 4);
    }
  };
}
