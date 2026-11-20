/**
 * Externa länkar: en osynlig, riktig <a>-länk ovanpå något som ritats i Phaser (DOM-lagret följer
 * kameran och scrollningen). Safari blockerar nya flikar som öppnas från kod, men aldrig ett tryck på en
 * riktig länk. lankKnapp = en vanlig Knapp med länk, lankYta = länk över valfri yta (t.ex. karriärrutan).
 */
import Phaser from 'phaser';
import { Knapp, type KnappVal } from './Button';
import { kopplaLank } from '../platform/openLink';

export function lankKnapp(scene: Phaser.Scene, x: number, y: number, etikett: string, val: KnappVal, url: string): Knapp {
  const knapp = new Knapp(scene, x, y, etikett, val, () => {});
  lankYta(scene, x, y, knapp.width, knapp.height, etikett, url, knapp);
  return knapp;
}

/** Länk över en yta med mitten i (x, y). mal skalas lite medan man trycker, som en knapp. */
export function lankYta(
  scene: Phaser.Scene,
  x: number,
  y: number,
  b: number,
  h: number,
  etikett: string,
  url: string,
  mal?: Phaser.GameObjects.Container,
): Phaser.GameObjects.DOMElement {
  const a = document.createElement('a');
  a.setAttribute('aria-label', etikett);
  a.style.cssText = `display:block;width:${b}px;height:${h}px;-webkit-tap-highlight-color:transparent;`;
  kopplaLank(a, url);
  if (mal) {
    a.addEventListener('pointerdown', () => mal.setScale(0.97));
    for (const t of ['pointerup', 'pointercancel', 'pointerleave']) a.addEventListener(t, () => mal.setScale(1));
  }
  return scene.add.dom(x, y, a).setDepth((mal?.depth ?? 0) + 1);
}
