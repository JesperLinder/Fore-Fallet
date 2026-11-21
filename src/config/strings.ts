/**
 * Alla gemensamma texter i spelet. Nivåspecifik text ligger i nivåfilerna (src/levels/kapitel-N/*.json)
 * och kapitlens titlar i kapitelfilerna (src/levels/kapitel-N/kapitel.json).
 * Scenerna hämtar text härifrån – ingen svensk text hårdkodas i scenkoden.
 */
export const text = {
  titel: {
    rubrik: 'Före fallet',
    underrubrik: 'Ett prejudikatspel',
    rad: 'En fylgia ser hindret innan det kommer. Nu är det din tur.',
    spela: 'Spela',
    omSpelet: 'Om spelet',
  },

  om: {
    rubrik: 'Om spelet',
    text: 'Före fallet är ett spel från Advokatfirman Fylgia. Varje nivå bygger på ett verkligt avgörande från Högsta domstolen. Sammanfattningarna är förenklade och är inte juridisk rådgivning – läs gärna hela avgörandena via länkarna efter varje nivå.',
    kallorRubrik: 'Källor',
    kallor: 'Rättsfallen kommer från Högsta domstolens avgöranden. Länkar till lagen.nu och domstol.se.',
    integritet: 'Integritetspolicy',
    nollstall: 'Nollställ framsteg',
    nollstallFraga: 'Nollställa framstegen?',
    nollstallText: 'Alla stjärnor och upplåsta nivåer försvinner. Det går inte att ångra.',
    nollstallJa: 'Nollställ',
    avbryt: 'Avbryt',
    nollstallt: 'Framstegen är nollställda.',
    version: (v: string) => `Version ${v}`,
  },

  grattis: {
    logotyp: 'Fylgia',
    rubrik: 'Du klarade hela spelet.',
    underrubrik: 'Grattis!',
    text: 'Fylgia söker ambitiösa jurister som du. Sök jobb hos oss.',
    sokJobb: 'Sök jobb hos Fylgia',
    tillKartan: 'Tillbaka till kartan',
    stjarnor: (antal: string, max: number) => `${antal} av ${max} stjärnor`,
    /** Den lilla knappen på kartan när spelet är klarat. */
    kartknapp: 'Du klarade hela spelet',
  },

  /** Kapitelvalet, mellan startskärmen och kartan. */
  kapitel: {
    overrubrik: 'Före fallet',
    rubrik: 'Välj kapitel',
    nummer: (nr: number) => `Kapitel ${nr}`,
    status: { klart: 'Klart', pagar: 'Pågår', last: 'Låst' },
  },

  /** Den kortare skärmen efter ett kapitel som inte är det sista. */
  kapitelKlart: {
    rubrik: 'Kapitel klart',
    stjarnor: (antal: string, max: number) => `${antal} / ${max} stjärnor`,
    nasta: (nr: number, titel: string) => `Nu väntar kapitel ${nr}: ${titel}`,
    tillNasta: 'Till nästa kapitel',
    /** Den lilla knappen på kartan när kapitlet är klarat. */
    kartknapp: 'Du klarade kapitlet',
  },

  karta: {
    /** Överst på kartan: "Kapitel 1 · Tio mål i Högsta domstolen", och under den kapitlets titel. */
    overrubrik: (nr: number, undertitel: string) => `Kapitel ${nr} · ${undertitel}`,
    spela: 'Spela',
    fylgiaMal: 'Fylgia-mål',
    info: 'Fylgia-målen spelas som de gick i verkligheten. Ibland vinner man allt, ibland halva. Så ser advokatlivet ut.',
    tillbaka: 'Tillbaka',
    /** Till höger på låsta nivåer som inte är byggda än. */
    kommerSnart: 'Kommer snart',
  },

  /** Hur varje mekanik visas på kartan, om nivån inte har en egen etikett. */
  mekanikNamn: {
    slingshot: 'Slangbella',
    invaders: 'Invaders',
    hybrid: 'Hybrid',
    memory: 'Memory',
    boss: 'Boss',
  } as Record<string, string>,

  /** Memory: etiketterna på halvorna av ett sönderrivet papper. */
  memory: {
    vanster: 'Vänster',
    hoger: 'Höger',
  },

  niva: {
    overrubrik: (nummer: number, referens: string) => `Nivå ${nummer} · ${referens}`,
    /** Före nivåetiketten från kapitel 2, t.ex. "K2 · Nivå 3 · NJA 1996 s. 598". Kapitel 1 visas utan. */
    kapitelPrefix: (kapitel: number) => `K${kapitel} · `,
    fylgiaViskar: 'Din fylgia viskar',
    pausRubrik: 'Paus',
    fortsatt: 'Fortsätt',
    borjaOm: 'Börja om',
    tillKartan: 'Till kartan',
    miss: 'Utanför',
    ute: 'Ute!',
    starta: 'Starta',
    tryckForAttFortsatta: 'Tryck för att fortsätta',
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
      'for-manga': () => 'Det blev för många missar.',
      'mal-omojligt': () => 'Det fanns inte tillräckligt många kvar att fånga.',
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
    /** Knappen efter sista nivån. */
    sasongKlar: 'Säsongen klar',
    /** Visas när nästa mål är låst för att spelaren fått 0 stjärnor. */
    kravForNasta: 'Minst en stjärna låser upp nästa mål',
    /** Rutan längst ner på domslutet, med länk till Fylgias karriärsida. */
    karriar: {
      rubrik: 'Gillar du tvister?',
      text: 'Fylgia söker juniorassistenter och biträdande jurister',
    },
  },

  /** Avslutningsskärmen efter ett kapitels sista nivå ("Säsongen klar"). */
  sasong: {
    rubrik: (nr: number) => `Säsong ${nr} klar`,
    delaKnapp: 'Dela resultat',
    kopierat: 'Kopierat!',
    delaText: (stjarnor: string, max: number) =>
      `Jag klarade Före fallet med ${stjarnor} av ${max} stjärnor. Klarar du dig bättre i Högsta domstolen?`,
    fortsatt: 'Fortsätt',
    /** Visas efter det sista spelbara kapitlet. */
    nasta: (nr: number) => `Säsong ${nr} kommer`,
  },

  /** Formaterar kronor med svenskt tusentalsavstånd: 25000 -> "25 000 kr". */
  kronor: (belopp: number) => `${Math.round(belopp).toLocaleString('sv-SE')} kr`,
} as const;
