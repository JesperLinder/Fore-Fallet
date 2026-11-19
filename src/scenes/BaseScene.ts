/**
 * Gemensam bas för alla scener: ställer in kameran så att scenen kan räkna i logiska punkter (390×844)
 * fast canvasen renderas i skärmens pixeltäthet, och tonar in scenen.
 */
import Phaser from 'phaser';
import { farg, type FargNamn } from '../config/theme';
import { HOJD, MITT_X, ZOOM } from '../config/display';

export abstract class BasScen extends Phaser.Scene {
  protected forberedKamera(bakgrund: FargNamn): void {
    this.input.enabled = true; // kan ha stängts av vid förra scenbytet
    const kamera = this.cameras.main;
    kamera.setZoom(ZOOM);
    kamera.centerOn(MITT_X, HOJD / 2);
    kamera.setBackgroundColor(farg[bakgrund]);
    kamera.fadeIn(180, 15, 40, 39);
  }

  /** Byter scen med en kort övertoning. */
  protected bytTill(nyckel: string, data?: object): void {
    this.input.enabled = false;
    this.cameras.main.fadeOut(160, 15, 40, 39);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(nyckel, data);
    });
  }

  /** Pekarens position i logiska punkter. */
  protected varldsPunkt(p: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    return this.cameras.main.getWorldPoint(p.x, p.y);
  }
}
