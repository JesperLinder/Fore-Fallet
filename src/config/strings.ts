/**
 * Alla gemensamma texter i spelet. Nivåspecifik text ligger i nivåfilerna (src/levels/*.json).
 * Scenerna hämtar text härifrån – ingen svensk text hårdkodas i scenkoden.
 */
export const text = {
  titel: {
    overrubrik: 'Ett prejudikatspel',
    rubrik: 'Före fallet',
    underrubrik: 'En fylgia ser hindret innan det kommer. Nu är det din tur.',
    spela: 'Spela',
  },

  karta: {
    overrubrik: 'Säsong 1 · tio mål i Högsta domstolen',
    rubrik: 'Rättsfallskartan',
    spela: 'Spela',
    fylgiaMal: 'Fylgia-mål',
    info: 'Fylgia-målen spelas som de gick i verkligheten. Ibland vinner man allt, ibland halva. Så ser advokatlivet ut.',
    tillbaka: 'Tillbaka',
  },

  /** Hur varje mekanik visas på kartan, om nivån inte har en egen etikett. */
  mekanikNamn: {
    slingshot: 'Slangbella',
    invaders: 'Invaders',
    hybrid: 'Hybrid',
  } as Record<string, string>,

  niva: {
    overrubrik: (nummer: number, referens: string) => `Nivå ${nummer} · ${referens}`,
    fylgiaViskar: 'Din fylgia viskar',
    pausRubrik: 'Paus',
    fortsatt: 'Fortsätt',
    borjaOm: 'Börja om',
    tillKartan: 'Till kartan',
    miss: 'Utanför',
    ute: 'Ute!',
    starta: 'Starta',
  },

  /** Förlustskärmen. Rubriken kommer från nivåfilen ("forlust.rubrik"). */
  forlust: {
    standardRubrik: 'Förlorat',
    forsokIgen: 'Försök igen',
    tillKartan: 'Till kartan',
    /** Standardförklaringar per orsak, om nivåfilen inte har egna. */
    orsaker: {
      'matare-full': (matare: string) => `${matare}: mätaren är full.`,
      'tid-slut': () => 'Tiden tog slut innan allt var rättat.',
      botten: () => 'Brickorna hann ända ner.',
      'skott-slut': () => 'Skotten tog slut.',
    },
  },

  installningar: {
    ljudPa: 'Ljud på',
    ljudAv: 'Ljud av',
  },

  domslut: {
    overrubrik: (nummer: number, referens: string) => `Nivå ${nummer} klar · ${referens}`,
    vinstRubrik: 'Domslut',
    halvvagsRubrik: 'Halvvägsvinst',
    domskalRubrik: 'Domskälen i korthet',
    vunnet: 'Vunnet',
    inteVunnet: 'Inte vunnet',
    lasFallet: 'Läs hela fallet',
    spelaIgen: 'Spela igen',
    forsokIgen: 'Försök igen',
    /** Raden under stjärnorna på nivåer med guldstjärna: tagen respektive inte tagen. */
    guldTagen: (text: string) => `Guldstjärna! ${text}`,
    guldKrav: (text: string) => `Guldstjärna: ${text}`,
    nastaMal: (titel: string) => `Nästa mål: ${titel}`,
    tillKartan: 'Till rättsfallskartan',
    /** Visas när nästa mål är låst för att spelaren fått 0 stjärnor. */
    kravForNasta: 'Minst en stjärna låser upp nästa mål',
    /** Rutan längst ner på domslutet, med länk till Fylgias karriärsida. */
    karriar: {
      rubrik: 'Gillar du tvister?',
      text: 'Fylgia söker juniorassistenter och biträdande jurister',
      url: 'https://www.fylgia.se/sv/karriar',
    },
  },

  /** Formaterar kronor med svenskt tusentalsavstånd: 25000 -> "25 000 kr". */
  kronor: (belopp: number) => `${Math.round(belopp).toLocaleString('sv-SE')} kr`,
} as const;
