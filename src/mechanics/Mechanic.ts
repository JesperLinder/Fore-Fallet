/** Gemensamt gränssnitt för spelmekanikerna (slangbella, invaders …) som LevelScene startar. */
import type Phaser from 'phaser';
import type { ForlustOrsak, Niva } from '../core/levelTypes';

/** Det en mekanik rapporterar när nivån är slut. */
export interface MekanikResultat {
  poang: number;
  skadestand: number;
  /** Sant om spelaren gjort något som ger noll stjärnor oavsett poäng. */
  nollstallt: boolean;
  /** Antal misstag och sekunder kvar, för nivåer med stjarnkrav. */
  misstag?: number;
  tidKvar?: number;
  /** Antal försök och fällor, för nivåer med stjarnkrav (hybrid). */
  forsok?: number;
  fallor?: number;
  /** Procent kvar på mätaren (invaders), för stjarnkrav.minMatare. */
  matareKvar?: number;
  /** Antal dekorfigurer som försvunnit (invaders), för stjarnkrav.maxDekorForlorade. */
  dekorForlorade?: number;
  /** Namngivna räknare (invaders: "raknas" i onHit/onPass), för stjarnkrav.maxAntal. */
  antal?: Record<string, number>;
  /** Satt om nivån är förlorad. Då visas förlustskärmen i stället för domslutet. */
  forlust?: ForlustOrsak;
}

export interface MekanikKontext {
  scene: Phaser.Scene;
  niva: Niva;
  /** Tipsrutan längst ner – mekaniken kan tona ner den medan spelaren siktar. */
  tips: Phaser.GameObjects.Container;
  avsluta: (resultat: MekanikResultat) => void;
}

export interface Mekanik {
  pausa(pausad: boolean): void;
  forstor(): void;
}

export type MekanikFabrik = (kontext: MekanikKontext) => Mekanik;
