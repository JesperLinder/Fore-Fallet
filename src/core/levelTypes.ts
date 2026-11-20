/**
 * Nivåformatet. Varje fil i src/levels/ följer antingen NivaPlatshallare (låst nivå som bara syns på kartan)
 * eller Niva (fullständig, spelbar nivå). En ny nivå ska aldrig kräva ny kod – bara en ny fil.
 */
import type { FargNamn } from '../config/theme';

export type MekanikTyp = 'slingshot' | 'invaders' | 'hybrid';
export type Resultat = 'vinst' | 'halvvagsvinst';

/** Minsta möjliga nivåfil: räcker för att synas (låst) på kartan. */
export interface NivaPlatshallare {
  id: string;
  nummer: number;
  titel: string;
  referens: string;
  mekanik: MekanikTyp;
  fylgiaMal?: boolean;
  /** Valfri etikett på kartan i stället för mekanikens namn, t.ex. "Boss" eller "Final". */
  etikett?: string;
}

/** En fullständig, spelbar nivå. */
export interface Niva extends NivaPlatshallare {
  fylgiaMal: boolean;
  uppdragstext: string;
  fylgiaTips: string;
  resultat: Resultat;
  /** Poäng som krävs för 1, 2 och 3 stjärnor (slangbella). Ange detta ELLER stjarnkrav. */
  stjarngranser?: { en: number; tva: number; tre: number };
  /** Krav för 1, 2 och 3 stjärnor räknat på misstag och tid kvar (invaders). Nivån måste vara klarad. */
  stjarnkrav?: { en: StjarnKrav; tva: StjarnKrav; tre: StjarnKrav };
  /** "ljus" (standard) eller "mork": styr färgerna på nivåns rubrik. */
  tema?: 'ljus' | 'mork';
  /** Bakgrund ritad som horisontella lager uppifrån och ner. */
  bana: { lager: BanLager[] };
  /** Objekt på banan (slangbella). Invaders-nivåer har en tom lista. */
  objekt: NivaObjekt[];
  /** Inställningar för slangbellan – krävs när mekanik är "slingshot". */
  slangbella?: SlangbellaInstallningar;
  /** Inställningar för invaders – krävs när mekanik är "invaders". */
  invaders?: InvadersInstallningar;
  /** Inställningar för hybrid (slangbella + borgenärer) – krävs när mekanik är "hybrid". */
  hybrid?: HybridInstallningar;
  /** Förlustskärmen, för mekaniker där man kan förlora. */
  forlust?: Forlust;
  domslut: Domslut;
}

export interface StjarnKrav {
  /** Högst så här många misstag. */
  maxMisstag?: number;
  /** Mer än så här många sekunder kvar på klockan. */
  tidKvarOver?: number;
  /** Vann på högst så här många försök (hybrid: kast med vinnarprojektilen). */
  maxForsok?: number;
  /** Gick i högst så här många fällor (hybrid: kast med en fälla, t.ex. avtalet). */
  maxFallor?: number;
  /** Minst så här många procent kvar på mätaren (invaders, t.ex. "God tro" 75). */
  minMatare?: number;
}

export type ForlustOrsak = 'matare-full' | 'tid-slut' | 'botten';

export interface Forlust {
  rubrik: string;
  /** Valfri förklaring per orsak. Saknas den används standardtexten i strings.ts. */
  orsaker?: Partial<Record<ForlustOrsak, string>>;
}

export interface BanLager {
  farg: FargNamn;
  /** Övre kant (y) för lagret. */
  topp: number;
  /** Höjd på den mjuka vågen i överkanten, 0 = rak. */
  vag?: number;
}

export interface Domslut {
  /** Rubrik på domslutsskärmen. Utelämnas den används "Domslut"/"Halvvägsvinst" beroende på resultat. */
  rubrik?: string;
  /** Kort sammanfattning av vad HD kom fram till (valfri). */
  text?: string;
  domskal: [string, string, string];
  lankTillFallet: string;
  /** Kursiv rad under stjärnorna, oavsett hur det gick (t.ex. för halvvägsvinst). */
  underrubrik?: string;
  /** Text i den lila Fylgia-rutan sist på domslutet. Visas bara för nivåer med fylgiaMal: true. */
  fylgiaruta?: string;
  /** Kursiv rad som beror på hur det gick, nyckel = antal stjärnor ("0"–"3"). */
  utfall?: Partial<Record<'0' | '1' | '2' | '3', string>>;
  /** Bara för halvvägsvinst. */
  vunnet?: string;
  inteVunnet?: string;
}

// ---------- Objekt på banan ----------

interface BasObjekt {
  x: number;
  y: number;
  /** Poäng när projektilen landar i/träffar objektet. */
  poang?: number;
}

/** Var projektilen skjuts ifrån. */
export interface UtslagObjekt extends BasObjekt {
  typ: 'utslag';
}

/** Målyta. Projektilen som stannar här ger poäng. */
export interface MalObjekt extends BasObjekt {
  typ: 'mal';
  rx: number;
  ry: number;
  farg: FargNamn;
  etikett?: string;
  flagga?: boolean;
  /** Extra bromsning när projektilen rullar på ytan (0–1). */
  friktion?: number;
  traffText: string;
}

/** Något man inte ska träffa. Kostar pengar och aktsamhet. */
export interface HinderObjekt extends BasObjekt {
  typ: 'hinder';
  utseende: string;
  b: number;
  h: number;
  skadestand: number;
  /** Ändring av mätaren (negativt = sänker). */
  matare: number;
  /** Om en träff ger noll stjärnor oavsett poäng. */
  nollstallerStjarnor: boolean;
  traffText: string;
}

/** Ytor utanför banan, t.ex. en parkering. Bara utseende. */
export interface ZonObjekt extends BasObjekt {
  typ: 'zon';
  b: number;
  h: number;
  farg: FargNamn;
  etikett?: string;
  etikettFarg?: FargNamn;
}

/** Linje, t.ex. en gränslinje. */
export interface LinjeObjekt extends BasObjekt {
  typ: 'linje';
  x2: number;
  y2: number;
  farg: FargNamn;
  streckad?: boolean;
}

/** Fristående pratbubbla, t.ex. "Slicezon!". */
export interface EtikettObjekt extends BasObjekt {
  typ: 'etikett';
  text: string;
  farg: FargNamn;
}

/** Ren dekoration ur figurbiblioteket (src/mechanics/art.ts). */
export interface DekorObjekt extends BasObjekt {
  typ: 'dekor';
  utseende: string;
  /** Valfri storlek för figurer som kan skalas (t.ex. "stall"). */
  b?: number;
  h?: number;
}

/** Fristående text, t.ex. "TRÄNARENS STALL". Centrerad på (x, y). */
export interface TextObjekt extends BasObjekt {
  typ: 'text';
  text: string;
  farg: FargNamn;
  /** Textstil: "overrubrik" (standard), "liten" eller "rubrik". */
  stil?: 'overrubrik' | 'liten' | 'rubrik';
}

export type NivaObjekt =
  | UtslagObjekt
  | MalObjekt
  | HinderObjekt
  | ZonObjekt
  | LinjeObjekt
  | EtikettObjekt
  | DekorObjekt
  | TextObjekt;

// ---------- Mekanikinställningar ----------

/** Kastfysiken: delas av slangbella och hybrid. */
export interface KastInstallningar {
  /** Hur långt man kan dra bakåt, i punkter. */
  maxDrag: number;
  /** Utgångsfart per punkt dragning. */
  kraft: number;
  /** Bromsning per steg i luften och på marken. */
  friktion: { luft: number; mark: number };
  /** Hur länge projektilen flyger (i fysiksteg) vid svagaste och starkaste skott. */
  flygtid: { min: number; max: number };
  /** Sidvind/slice som verkar medan projektilen är i luften. Utelämnas = ingen vind. */
  vind?: {
    x: number;
    y: number;
    etikett: string;
    /**
     * Valfritt: slumpa sidvinden (x) inför varje skott, mellan min och max.
     * motsattChans (0–1) = sannolikheten att den blåser åt andra hållet.
     */
    variation?: { min: number; max: number; motsattChans?: number };
  };
  /** Hur stor del (0–1) av flygbanan den prickade siktlinjen visar. 1 = hela vägen till landning (standard). */
  siktlinje?: number;
  /** Den del av skärmen där projektilen är i spel. Utanför = ute. */
  spelplan: { x: number; y: number; b: number; h: number };
}

export interface SlangbellaInstallningar extends KastInstallningar {
  /** Antal skott. */
  antal: number;
  /** Utseende på projektilen (figur i art.ts). */
  projektil: string;
  /** Sidvind/slice (krävs för slangbellan, eftersom vindindikatorn visas). */
  vind: NonNullable<KastInstallningar['vind']>;
  /** Rubriker i resultatraden. */
  hud: { matare: string; projektiler: string; kostnad: string };
}

// ---------- Invaders ----------

/** Allt som styr en invaders-nivå. Se README och src/levels/_mall-invaders.md. */
export interface InvadersInstallningar {
  spelare: {
    /** Figur i art.ts, t.ex. "textmarkor". */
    utseende: string;
    /** Spelarens mittpunkt i höjdled. */
    y: number;
    b: number;
    h: number;
    /** Valfri text på spelaren, t.ex. "BIL-\nREGISTRET". */
    etikett?: string;
  };
  skott: {
    /** "slapp" = skjuter när fingret släpps, "auto" = skjuter hela tiden medan fingret är nere. */
    lage: 'slapp' | 'auto';
    /** Minsta tid mellan två skott (ms). */
    intervall: number;
    /** Valfri figur (art.ts) för skottet, t.ex. "stampelavtryck". Standard: en smal guldstav. */
    utseende?: string;
    /** Skottets fart uppåt (punkter per sekund). */
    fart: number;
  };
  brickor: RutnatInstallningar<BrickData> & {
    /** Valfri figur (art.ts) på varje bricka, med etiketten i liten text under, t.ex. "bilsiluett". */
    ikon?: string;
    /** Rita bara den här figuren (art.ts), utan ruta och etikett, t.ex. "ufo". */
    figur?: string;
    /** Skotten passerar igenom brickorna (de kan inte skjutas ner), t.ex. ufon. */
    skottGenom?: boolean;
  };
  /** Fallande hot som ska skjutas ner innan de når botten (valfritt). */
  hot?: HotInstallningar;
  /** Bakgrundshändelser som spelaren inte kan påverka, med valfri räknare (valfritt). */
  dekor?: DekorInstallningar;
  /**
   * Vad som händer när en bricka når spelaren ("släpps igenom"), per typ. Anges detta försvinner brickan
   * med regelns effekt i stället för att ge förlust; "dold" gäller brickor som inte avslöjats.
   */
  botten?: { dold?: BottenRegel; fel?: BottenRegel; ratt?: BottenRegel };
  /** Valfria texter (pratbubbla) vid misstag. */
  misstagText?: { rattTraffad?: string; fangstMissad?: string };
  /** Valfri ruta under rubriken med en längre text, t.ex. uppdraget. */
  infotext?: string;
  /** Saker som faller och ska fångas (valfritt). */
  fangst?: FangstData[];
  /** Block som stoppar spelarens skott (valfritt). */
  skydd?: SkyddData[];
  /** Nedräkning (valfritt). dold: klockan går men visas inte. */
  tid?: { sekunder: number; etikett: string; dold?: boolean };
  matare: {
    namn: string;
    /** Antal steg innan mätaren är full. */
    steg: number;
    /** Valfri text till höger i mätarraden. */
    status?: string;
    /**
     * "steg" (standard): stapel i rutor längst ner som fylls vid misstag.
     * "procent": procent kvar uppe till höger (t.ex. "God tro 100 %"), sjunker vid misstag. Tar klockans plats.
     * "kort": ett kort under rubriken med en guldstapel som börjar full och krymper (t.ex. "Försäkringen").
     */
    visning?: 'steg' | 'procent' | 'kort';
  };
  /** Hur många steg mätaren stiger per misstag av varje slag. */
  misstag: { rattTraffad: number; fangstMissad: number };
  /** Rutan under rubriken, t.ex. "Rätt rubrik: KROGKUNG". Första står till vänster, sista till höger. */
  info?: { etikett: string; varde: string; serif?: boolean }[];
  /** Kort instruktion mitt på planen som tonas bort efter några sekunder. */
  instruktion?: { text: string; y: number };
  /**
   * Alla villkor måste vara uppfyllda för vinst. "alla-klara" = varje bricka bortskjuten eller släppt igenom.
   * "overlev" = tiden har gått ut utan förlust (kräver "tid").
   */
  vinst: ('fel-borta' | 'alla-fangade' | 'alla-klara' | 'overlev')[];
  /** Något av villkoren ger förlust. */
  forlust: ForlustOrsak[];
  /** Vid vinst: brickor och fångstobjekt med "plats" flyttas till en rad på denna höjd. */
  slutrad?: { y: number };
}

/** Ett marscherande rutnät (invaders-brickor, hybridens borgenärer). */
export interface RutnatInstallningar<T> {
  /** Rader uppifrån och ner. null = tom plats. */
  rader: (T | null)[][];
  b: number;
  h: number;
  mellanrum: number;
  /** Valfri sidförskjutning (punkter) per rad, t.ex. [0, 35] för en halv bricka på rad 2. */
  forskjutning?: number[];
  /** Översta radens överkant vid start. Rutnätet centreras i sidled mellan kanterna. */
  startY: number;
  /** Rörelse: steg i sidled (punkter), steg nedåt vid kanten, tid mellan stegen (ms). */
  steg: { x: number; ned: number; intervall: number };
  /** Hur långt ut rutnätet får gå (x för vänster och höger kant). */
  kant: { vanster: number; hoger: number };
  /** Rita tomma platser (null) som streckade rutor. */
  visaTomma?: boolean;
  /** Blanda objektens platser slumpmässigt varje gång nivån startar (tomma platser står kvar). */
  blanda?: boolean;
  /**
   * Vänd vid kanten räknat på hela den ursprungliga formationen, även när objekt försvunnit.
   * Utan detta (standard, som klassisk invaders) får färre objekt längre väg i sidled och kommer ner långsammare.
   */
  fastBredd?: boolean;
}

export interface BrickData {
  etikett: string;
  /** "fel" ska skjutas bort, "ratt" får inte skjutas. */
  typ: 'fel' | 'ratt';
  /** Plats i slutraden (0 = först). För en fel-bricka med ersattning: ersättningens plats. */
  plats?: number;
  /** Bara för fel-brickor: rätt bokstav/text som dyker upp på samma ställe när brickan skjutits bort. */
  ersattning?: string;
  /**
   * Reveal: brickan är dold tills den träffas första gången och visar då bara den här etiketten
   * (streckad kontur). Första träffen avslöjar "typ" och "etikett"; brickan förstörs inte.
   */
  dold?: { etikett: string };
}

/** Fallande hot: släpps uppifrån och ska skjutas ner innan de når spelaren. */
export interface HotInstallningar {
  /** Figur i art.ts, t.ex. "uppsagningsbrev". */
  utseende: string;
  /** Storlek (träffyta). */
  b: number;
  h: number;
  /** Valfri etikett under hotet, t.ex. "Uppsägning i förtid". */
  etikett?: string;
  /** "forsta" (standard): etiketten visas bara på det första hotet. "alltid": på alla. */
  visaEtikett?: 'forsta' | 'alltid';
  /** "fran-fiende": släpps från en slumpvis fiende. "slumpvis-overst": slumpvis x på höjden y. */
  start: 'fran-fiende' | 'slumpvis-overst';
  /** Starthöjd för "slumpvis-overst". */
  y?: number;
  /** Fallhastighet (punkter per sekund). */
  fart: number;
  /** Tid mellan två hot (ms) i början. */
  intervall: number;
  /** Valfritt: tid mellan hot (ms) i slutet. Tempot ändras jämnt över nivåns tid (kräver "tid"). */
  slutIntervall?: number;
  /** Väntetid innan första hotet (ms). Standard: intervall. */
  fordrojning?: number;
  /** Vad som händer när ett hot når spelaren. */
  botten: BottenRegel;
}

/** Bakgrundshändelser (rent visuellt) med valfri räknare. */
export interface DekorInstallningar {
  /** Figurerna som händelserna verkar på, t.ex. åtta kor i hagen. */
  figurer: { utseende: string; x: number; y: number }[];
  /** Händelse som upprepas: en slumpvis kvarvarande figur påverkas. Slutar när figurerna är slut. */
  handelse: {
    /** "lyft": figuren lyfts upp i en ljuskägla från närmaste fiende och försvinner. */
    rorelse: 'lyft';
    /** Tid mellan händelserna (ms). */
    intervall: number;
    /** Tid till första händelsen (ms). Standard: intervall. */
    start?: number;
    /** Hur länge en händelse pågår (ms). */
    langd: number;
    /** Valfri figur att växla med under händelsen, t.ex. "ko-sprattel" (sprattlande ben). */
    vaxla?: string;
    /** Valfritt ljud, t.ex. "muu". */
    ljud?: 'muu';
  };
  /** Valfri räknare i ett kort bredvid mätaren. {kvar} och {totalt} byts mot siffror. */
  raknare?: { namn: string; text: string };
}

/** Vad som händer när en bricka släpps igenom (når spelaren). */
export interface BottenRegel {
  /** Steg på mätaren (räknas som ett misstag om större än 0). */
  matare?: number;
  poang?: number;
  /** Pratbubbla, t.ex. "Du kollade inte registret". */
  text?: string;
}

export interface FangstData {
  etikett: string;
  x: number;
  /** Startposition (mittpunkt). */
  y: number;
  /** Fallhastighet (punkter per sekund). */
  fart: number;
  /** Väntetid innan den börjar falla (ms). */
  fordrojning?: number;
  radie?: number;
  /** Börjar om från start om den missas (annars är nivån inte längre vinnbar). Standard: ja. */
  aterkommer?: boolean;
  plats?: number;
}

export interface SkyddData {
  etikett: string;
  x: number;
  y: number;
  b: number;
  h: number;
  /** Antal skott blocket tål. */
  talighet: number;
}

// ---------- Hybrid ----------

/**
 * Hybrid: slangbella mot ett mål medan en formation (t.ex. borgenärer) marscherar nedåt.
 * Banan (stall, texter, slangbellans plats via "utslag") ritas från nivåns "objekt", som i slangbellan.
 */
export interface HybridInstallningar {
  /** Kastfysiken, samma fält som slangbellan. */
  kast: KastInstallningar;
  /** Det spelaren kan kasta. En knapp per projektil längst ner. */
  projektiler: HybridProjektil[];
  /** id på den projektil som är vald från början. */
  startval: string;
  /** Målet: en vinnarprojektil som stannar här vinner nivån. Fällor studsar bort härifrån. */
  mal: { x: number; y: number; b: number; h: number };
  /** Ytan som fällor studsar mot (t.ex. hela köparens stall). Utelämnas = målet. */
  studsyta?: { x: number; y: number; b: number; h: number };
  /** Texten som blinkar till vid målet när man vinner (t.ex. "Tradition!"). */
  vinstText?: string;
  /** Formationen som marscherar nedåt. Kan inte skjutas. */
  fiender: RutnatInstallningar<{ etikett: string }> & { utseende: string };
  /** Når formationens underkant hit (y) innan man vunnit är nivån förlorad (orsak "botten"). */
  faraY: number;
  /** Rutan uppe till höger, t.ex. "Borgenärer / 4 i kö". {antal} byts mot antalet fiender. */
  hud?: { rubrik: string; varde: string };
}

export interface HybridProjektil {
  id: string;
  /** Text på knappen, t.ex. "Kasta hästen". */
  knapp: string;
  /** Figur i art.ts. */
  utseende: string;
  /** Valfritt namn under slangbellan när projektilen är laddad, t.ex. "Kelly Sig". */
  namn?: string;
  /**
   * "vinnare": vinner om den stannar i målet; annars springer den tillbaka och man får försöka igen.
   * "falla": studsar alltid bort från studsytan. Räknas som en fälla i stjärnkraven.
   */
  roll: 'vinnare' | 'falla';
  /** Pratbubbla första gången projektilen studsar/landar (fällor). */
  forstaText?: string;
  /** Vinnare som missar: vänta så här länge (ms), galoppera sedan hit och kom tillbaka. */
  aterkomst?: { vantaMs: number; till: { x: number; y: number } };
}
