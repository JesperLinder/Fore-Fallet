/**
 * Textfabrik. Alla texter skapas här med profilens typsnitt och storlekar,
 * och renderas i skärmens pixeltäthet så att de blir skarpa på telefon.
 */
import Phaser from 'phaser';
import { css, typsnitt, type FargNamn } from '../config/theme';
import { ZOOM } from '../config/display';

export type TextVariant =
  | 'overrubrik' // liten, versaler, spärrad sans – "NIVÅ 1 · NJA 1993 S. 149"
  | 'jatte' // titelskärmens rubrik
  | 'titel' // sidrubrik, t.ex. "Rättsfallskartan"
  | 'rubrik' // kortrubrik, t.ex. nivånamn i listan
  | 'ingress' // kursiv serif
  | 'citat' // serif brödtext, t.ex. fylgians tips
  | 'brod'
  | 'liten'
  | 'knapp'
  | 'etikett'; // pyttesmå versaler i märken

interface VariantStil {
  familj: string;
  storlek: number;
  vikt: string;
  kursiv?: boolean;
  versaler?: boolean;
  sparr?: number;
  radavstand?: number;
}

const VARIANTER: Record<TextVariant, VariantStil> = {
  overrubrik: { familj: typsnitt.brod, storlek: 12, vikt: '600', versaler: true, sparr: 1.4 },
  jatte: { familj: typsnitt.rubrik, storlek: 64, vikt: '400', sparr: -1.5 },
  titel: { familj: typsnitt.rubrik, storlek: 34, vikt: '400', sparr: -0.6 },
  rubrik: { familj: typsnitt.rubrik, storlek: 20, vikt: '400' },
  ingress: { familj: typsnitt.rubrik, storlek: 18, vikt: '400', kursiv: true, radavstand: 4 },
  citat: { familj: typsnitt.rubrik, storlek: 17, vikt: '400', radavstand: 4 },
  brod: { familj: typsnitt.brod, storlek: 15, vikt: '400', radavstand: 5 },
  liten: { familj: typsnitt.brod, storlek: 12, vikt: '400', radavstand: 3 },
  knapp: { familj: typsnitt.brod, storlek: 16, vikt: '600' },
  etikett: { familj: typsnitt.brod, storlek: 10, vikt: '600', versaler: true, sparr: 1 },
};

export interface TextVal {
  /** Radbrytningsbredd i punkter. */
  bredd?: number;
  justering?: 'left' | 'center' | 'right';
  origo?: [number, number];
  storlek?: number;
}

export function skapaText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  innehall: string,
  variant: TextVariant,
  farg: FargNamn,
  val: TextVal = {},
): Phaser.GameObjects.Text {
  const v = VARIANTER[variant];
  const storlek = val.storlek ?? v.storlek;
  const stil: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: v.familj,
    fontSize: `${storlek}px`,
    fontStyle: [v.kursiv ? 'italic' : '', v.vikt].join(' ').trim(),
    color: css(farg),
    align: val.justering ?? 'left',
    resolution: ZOOM,
    lineSpacing: v.radavstand ?? 0,
    padding: { x: 2, y: 2 },
  };
  if (val.bredd) stil.wordWrap = { width: val.bredd, useAdvancedWrap: true };

  const t = scene.add.text(x, y, v.versaler ? innehall.toLocaleUpperCase('sv-SE') : innehall, stil);
  if (v.sparr) t.setLetterSpacing(v.sparr);
  t.setOrigin(...(val.origo ?? [0, 0]));
  return t;
}
