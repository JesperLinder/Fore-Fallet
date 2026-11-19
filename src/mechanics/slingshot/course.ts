/**
 * Ritar slangbellebanans objekt från nivåfilen (zoner, linjer, mål, hinder, etiketter)
 * och skapar Matter-kroppar för hindren. Returnerar det slangbellan behöver för att räkna poäng.
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import type { HinderObjekt, MalObjekt, Niva } from '../../core/levelTypes';
import { skapaText } from '../../ui/text';
import { streckadLinje } from '../../ui/shapes';
import { pratbubbla } from '../../ui/Badge';
import { ritaFigur } from '../art';

export interface Bana {
  utslag: { x: number; y: number };
  mal: MalObjekt[];
  /** Matter-kroppens id -> hindret den hör till. */
  hinder: Map<number, HinderObjekt>;
}

export const DJUP_BANA = 1;

export function byggBana(scene: Phaser.Scene, niva: Niva): Bana {
  const g = scene.add.graphics().setDepth(DJUP_BANA);
  const bana: Bana = { utslag: { x: 80, y: 620 }, mal: [], hinder: new Map() };

  for (const o of niva.objekt) {
    switch (o.typ) {
      case 'utslag':
        bana.utslag = { x: o.x, y: o.y };
        break;

      case 'zon':
        g.fillStyle(farg[o.farg], 1).fillRect(o.x, o.y, o.b, o.h);
        if (o.etikett) {
          skapaText(scene, o.x + 14, o.y + 12, o.etikett, 'overrubrik', o.etikettFarg ?? 'morkgron', { storlek: 11 })
            .setLineSpacing(2)
            .setDepth(DJUP_BANA);
        }
        break;

      case 'linje':
        g.lineStyle(2, farg[o.farg], 1);
        if (o.streckad) {
          streckadLinje(g, [new Phaser.Math.Vector2(o.x, o.y), new Phaser.Math.Vector2(o.x2, o.y2)], 6, 4);
        } else {
          g.lineBetween(o.x, o.y, o.x2, o.y2);
        }
        break;

      case 'dekor':
        ritaFigur(g, o.utseende, o.x, o.y, o.b, o.h);
        break;

      case 'text':
        skapaText(scene, o.x, o.y, o.text, o.stil ?? 'overrubrik', o.farg, { origo: [0.5, 0.5], storlek: o.stil ? undefined : 11 })
          .setDepth(DJUP_BANA);
        break;

      case 'etikett':
        pratbubbla(scene, o.x, o.y, o.text, o.farg).setDepth(DJUP_BANA + 1);
        break;

      case 'mal':
        bana.mal.push(o);
        g.fillStyle(farg[o.farg], 1).fillEllipse(o.x, o.y, o.rx * 2, o.ry * 2);
        if (o.flagga) ritaFigur(g, 'flagga', o.x + o.rx * 0.15, o.y - 2);
        if (o.etikett) {
          skapaText(scene, o.x, o.y + o.ry + 14, o.etikett, 'overrubrik', 'beige', { origo: [0.5, 0.5], storlek: 11 })
            .setDepth(DJUP_BANA);
        }
        break;

      case 'hinder': {
        ritaFigur(g, o.utseende, o.x, o.y, o.b, o.h);
        const kropp = scene.matter.add.rectangle(o.x, o.y, o.b, o.h, {
          isStatic: true,
          restitution: 0.4,
          label: 'hinder',
        });
        bana.hinder.set(kropp.id, o);
        break;
      }
    }
  }

  return bana;
}

/** Sant om punkten ligger inom målets ellips. */
export function iMal(mal: MalObjekt, x: number, y: number): boolean {
  return ((x - mal.x) / mal.rx) ** 2 + ((y - mal.y) / mal.ry) ** 2 <= 1;
}
