/**
 * Knapp som öppnar en extern länk. Ser ut som en vanlig Knapp men har en osynlig, riktig <a>-länk
 * ovanpå (Phasers DOM-lager följer kameran och scrollningen). Safari blockerar nya flikar som öppnas
 * från kod, men aldrig ett tryck på en riktig länk.
 */
import Phaser from 'phaser';
import { Knapp, type KnappVal } from './Button';
import { kopplaLank } from '../platform/openLink';

export function lankKnapp(scene: Phaser.Scene, x: number, y: number, etikett: string, val: KnappVal, url: string): Knapp {
  const knapp = new Knapp(scene, x, y, etikett, val, () => {});
  const a = document.createElement('a');
  a.setAttribute('aria-label', etikett);
  a.style.cssText = `display:block;width:${knapp.width}px;height:${knapp.height}px;-webkit-tap-highlight-color:transparent;`;
  kopplaLank(a, url);
  // Ge samma tryckkänsla som de andra knapparna.
  a.addEventListener('pointerdown', () => knapp.setScale(0.97));
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) a.addEventListener(t, () => knapp.setScale(1));
  scene.add.dom(x, y, a).setDepth(knapp.depth + 1);
  return knapp;
}
