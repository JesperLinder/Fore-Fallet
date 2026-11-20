/** Kopplar mekaniknamnet i nivåfilen ("slingshot", "invaders") till koden som kör det. */
import type { MekanikTyp } from '../core/levelTypes';
import type { Mekanik, MekanikFabrik, MekanikKontext } from './Mechanic';
import { Slingshot } from './Slingshot';
import { Invaders } from './Invaders';
import { Hybrid } from './Hybrid';
import { Memory } from './Memory';

const mekaniker: Partial<Record<MekanikTyp, MekanikFabrik>> = {
  slingshot: (k) => new Slingshot(k),
  invaders: (k) => new Invaders(k),
  hybrid: (k) => new Hybrid(k),
  memory: (k) => new Memory(k),
};

export function harMekanik(typ: MekanikTyp): boolean {
  return typ in mekaniker;
}

export function skapaMekanik(kontext: MekanikKontext): Mekanik {
  const fabrik = mekaniker[kontext.niva.mekanik];
  if (!fabrik) throw new Error(`Mekaniken "${kontext.niva.mekanik}" är inte byggd än`);
  return fabrik(kontext);
}
