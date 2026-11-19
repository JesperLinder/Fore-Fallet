/**
 * Fylgias grafiska profil: färger, typsnitt, avstånd och radier.
 * Allt som ritas i spelet hämtar sina värden härifrån – inga färgkoder i scenerna.
 */

/** Profilfärgerna som Phaser-tal (0xRRGGBB). */
export const farg = {
  morkgron: 0x0f2827, // huvudfärg
  gron: 0x2c453f,
  beige: 0xeee1d1,
  ljusbeige: 0xf7f1e9,
  guld: 0xba8500, // accent – aldrig text på ljus bakgrund
  morkockra: 0x6b4e04, // text på ljus bakgrund
  lila: 0xb47faf, // Fylgia-markering
  vinrod: 0x47131d, // varningar och fel
} as const;

export type FargNamn = keyof typeof farg;

/** Gör om en profilfärg till CSS-sträng ("#0f2827"), som Phaser-text vill ha. */
export function css(namn: FargNamn): string {
  return '#' + farg[namn].toString(16).padStart(6, '0');
}

/**
 * Typsnitt. Byt här (och i index.html) när ABC Arizona ska in.
 * rubrik = serif för rubriker, brod = sans för brödtext och knappar.
 */
export const typsnitt = {
  rubrik: '"Newsreader", Georgia, serif',
  brod: '"Instrument Sans", "Helvetica Neue", Arial, sans-serif',
} as const;

/** Familjenamnen som måste vara laddade innan text ritas (används av BootScene). */
export const typsnittAttLadda = [
  '400 24px "Newsreader"',
  'italic 400 24px "Newsreader"',
  '400 16px "Instrument Sans"',
  '600 16px "Instrument Sans"',
];

/** Avstånd i logiska pixlar. */
export const avstand = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  sida: 20, // sidmarginal
} as const;

/** Hörnradier. */
export const radie = {
  s: 10,
  m: 16,
  l: 22,
} as const;

/** Minsta storlek för något man ska kunna trycka på. */
export const MIN_TRYCKYTA = 44;
