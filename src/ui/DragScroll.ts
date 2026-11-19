/**
 * Låter en hel scen scrollas lodrätt med fingret (som en webbsida).
 * Skiljer på tryck och drag: efter en dragning returnerar arDrag() sant så att knappar kan ignorera trycket.
 */
import Phaser from 'phaser';
import { HOJD, MITT_X } from '../config/display';

const DRAGGRANS = 8;

export class DragScroll {
  private start = 0;
  private startCentrum = 0;
  private centrum = HOJD / 2;
  private dragit = false;
  private nere = false;

  constructor(private scene: Phaser.Scene, private innehallsHojd: number) {
    const kamera = scene.cameras.main;
    const input = scene.input;
    input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.nere = true;
      this.dragit = false;
      this.start = p.y;
      this.startCentrum = this.centrum;
    });
    input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.nere || !p.isDown) return;
      const dy = (p.y - this.start) / kamera.zoom;
      if (Math.abs(dy) > DRAGGRANS) this.dragit = true;
      if (this.dragit) this.flytta(this.startCentrum - dy);
    });
    input.on('pointerup', () => {
      this.nere = false;
      // Låt knapparnas pointerup läsa arDrag() innan flaggan nollställs.
      scene.time.delayedCall(0, () => (this.dragit = false));
    });
    input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.flytta(this.centrum + dy));
  }

  arDrag(): boolean {
    return this.dragit;
  }

  private flytta(nyttCentrum: number): void {
    const max = Math.max(HOJD / 2, this.innehallsHojd - HOJD / 2);
    this.centrum = Phaser.Math.Clamp(nyttCentrum, HOJD / 2, max);
    this.scene.cameras.main.centerOn(MITT_X, this.centrum);
  }
}
