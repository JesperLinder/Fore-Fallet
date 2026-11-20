/**
 * Bossdelen av en slangbellenivå: bossmätaren överst (alltid full, blinkar till vid träff) och bossens
 * repliker i talbubblor ovanför bossblocket. Styrs av slangbella.bossMatare, svarFran och projektilernas "svar".
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import { BREDD } from '../../config/display';
import type { SlangbellaInstallningar } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { talbubbla } from '../../ui/Badge';
import type { Fysikblock } from './blocks';

const MATARE_Y = 92;
const X0 = 16;
const REPLIK_MS = 2500;

export class Boss {
  private stapel?: Phaser.GameObjects.Graphics;
  private status?: Phaser.GameObjects.Text;
  private replikObj?: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private inst: SlangbellaInstallningar,
    private block: Fysikblock,
  ) {
    const m = inst.bossMatare;
    if (!m) return;
    skapaText(scene, X0, MATARE_Y, m.namn, 'overrubrik', 'ljusbeige', { storlek: 11 }).setDepth(30);
    this.status = skapaText(scene, BREDD - X0, MATARE_Y, m.status, 'overrubrik', 'ljusbeige', { origo: [1, 0], storlek: 11 }).setDepth(30);
    this.stapel = scene.add.graphics().setDepth(30);
    this.ritaStapel(farg.ljusbeige);
  }

  /** Träff: stapeln blinkar till och statusen visar blinkText ("Oförändrad") en stund. Stapeln är fortfarande full. */
  blinka(): void {
    const m = this.inst.bossMatare;
    if (!m || !this.status) return;
    this.ritaStapel(farg.lila);
    this.status.setText(m.blinkText.toUpperCase()); // överrubriker skrivs med versaler
    this.scene.time.delayedCall(450, () => this.ritaStapel(farg.ljusbeige));
    this.scene.time.delayedCall(1300, () => this.status?.setText(m.status.toUpperCase()));
  }

  /** Bossen säger något: talbubbla ovanför blocket i 2,5 sekunder. En ny replik ersätter den förra. */
  replik(text: string): void {
    const b = this.inst.svarFran ? this.block.hamta(this.inst.svarFran) : undefined;
    if (!b) return;
    this.replikObj?.destroy();
    const x = Phaser.Math.Clamp(b.kropp.position.x, 140, BREDD - 140);
    const y = b.kropp.position.y - b.data.h / 2 - 34;
    const r = talbubbla(this.scene, x, y, text).setDepth(25).setScale(0.7).setAlpha(0);
    this.replikObj = r;
    this.scene.tweens.add({ targets: r, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: r, alpha: 0, delay: REPLIK_MS, duration: 300, onComplete: () => r.destroy() });
  }

  private ritaStapel(f: number): void {
    this.stapel?.clear().fillStyle(f, 1).fillRoundedRect(X0, MATARE_Y + 20, BREDD - X0 * 2, 10, 5);
  }
}
