/** Startscen: laddar logotyperna, väntar in typsnitten (så att ingen text ritas med fel typsnitt) och går sedan till titelskärmen. */
import Phaser from 'phaser';
import { typsnittAttLadda } from '../config/theme';
import { laddaLogotyper } from '../ui/Logo';

const MAX_VANTAN_MS = 3000;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    laddaLogotyper(this);
  }

  async create(): Promise<void> {
    const laddning = Promise.all(typsnittAttLadda.map((f) => document.fonts.load(f)));
    const timeout = new Promise((klar) => setTimeout(klar, MAX_VANTAN_MS));
    try {
      await Promise.race([laddning, timeout]);
    } catch {
      // Typsnitten ligger lokalt; skulle de ändå inte laddas används reservtypsnitten. Spelet fungerar ändå.
    }
    this.scene.start('Title');
  }
}
