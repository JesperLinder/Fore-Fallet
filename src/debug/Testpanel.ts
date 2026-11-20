/**
 * Testlägets knappar (bara med ?debug=1 och bara i utvecklings-/testbygget, se flaggor.ts).
 * Små knappar längst ner i nivån: hoppa till domslut (vinst/halvvägsvinst/förlust),
 * och på kartan: nollställ framsteg. Texterna är bara för utvecklare och ligger därför här, inte i strings.ts.
 */
import Phaser from 'phaser';
import { farg } from '../config/theme';
import { BREDD, HOJD, MITT_X } from '../config/display';
import { skapaText } from '../ui/text';
import { framsteg } from '../core/progress';
import type { ForlustOrsak, Niva } from '../core/levelTypes';
import type { DomslutData } from '../scenes/LevelScene';

const DJUP = 300;

export interface TestKnapp {
  text: string;
  vidTryck: () => void;
}

/** En rad små knappar centrerad längst ner (eller på höjden y), över allt annat. */
export function testRad(scene: Phaser.Scene, knappar: TestKnapp[], y = HOJD - 22): Phaser.GameObjects.Container {
  const rad = scene.add.container(0, y).setDepth(DJUP);
  const delar = knappar.map((k) => {
    const t = skapaText(scene, 0, 0, k.text, 'knapp', 'ljusbeige', { origo: [0.5, 0.5], storlek: 12 });
    const b = t.width + 20;
    const bg = scene.add.rectangle(0, 0, b, 30, farg.vinrod, 0.92).setStrokeStyle(1, farg.lila);
    const c = scene.add.container(0, 0, [bg, t]).setSize(b, 30);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      k.vidTryck();
    });
    return { c, b };
  });
  const total = delar.reduce((s, d) => s + d.b, 0) + (delar.length - 1) * 6;
  let x = (BREDD - total) / 2;
  for (const d of delar) {
    d.c.setX(x + d.b / 2);
    x += d.b + 6;
    rad.add(d.c);
  }
  return rad;
}

/** Liten etikett "TESTLÄGE" så att man ser att läget är på. */
export function testEtikett(scene: Phaser.Scene, x: number, y: number): void {
  skapaText(scene, x, y, 'TESTLÄGE', 'overrubrik', 'vinrod', { origo: [0.5, 0.5], storlek: 10 }).setDepth(DJUP);
}

/** Nivån: hoppa direkt till domslut (3 eller 1 stjärna, guld om nivån har det) eller till förlustskärmen. */
export function testknapparNiva(scene: Phaser.Scene, niva: Niva, domslut: (d: DomslutData) => void, forlust: (o: ForlustOrsak) => void): void {
  const vinst = niva.resultat === 'halvvagsvinst' ? 'Halvvägsvinst' : 'Vinst';
  const orsak = (Object.keys(niva.forlust?.orsaker ?? {})[0] ?? 'tid-slut') as ForlustOrsak;
  const hoppa = (stjarnor: number): void => {
    const guld = stjarnor === 3 && !!niva.guldstjarna;
    framsteg.sparaResultat(niva.id, stjarnor);
    if (guld) framsteg.sparaGuld(niva.id);
    domslut({ id: niva.id, stjarnor, guld, poang: 0, skadestand: 0 });
  };
  testRad(scene, [
    { text: `${vinst} 3★`, vidTryck: () => hoppa(3) },
    { text: `${vinst} 1★`, vidTryck: () => hoppa(1) },
    { text: 'Förlust', vidTryck: () => forlust(orsak) },
  ]);
}

/** Kartan: etikett i sidhuvudet och "Nollställ framsteg" under listan. Returnerar ny y. */
export function testknapparKarta(scene: Phaser.Scene, y: number, omstart: () => void): number {
  testEtikett(scene, MITT_X, 76);
  testRad(scene, [{ text: 'Nollställ framsteg', vidTryck: () => { framsteg.nollstall(); omstart(); } }], y + 15);
  return y + 30;
}
