/**
 * Nivåformatet. Varje fil i src/levels/ följer antingen NivaPlatshallare (låst nivå som bara syns på kartan)
 * eller Niva (fullständig, spelbar nivå). En ny nivå ska aldrig kräva ny kod – bara en ny fil.
 */
import type { FargNamn } from '../config/theme';

export type MekanikTyp = 'slingshot' | 'invaders';
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
  /** Förlustskärmen, för mekaniker där man kan förlora. */
  forlust?: Forlust;
  domslut: Domslut;
}

export interface StjarnKrav {
  /** Högst så här många misstag. */
  maxMisstag?: number;
  /** Mer än så här många sekunder kvar på klockan. */
  tidKvarOver?: number;
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
}

export type NivaObjekt =
  | UtslagObjekt
  | MalObjekt
  | HinderObjekt
  | ZonObjekt
  | LinjeObjekt
  | EtikettObjekt
  | DekorObjekt;

// ---------- Mekanikinställningar ----------

export interface SlangbellaInstallningar {
  /** Antal skott. */
  antal: number;
  /** Utseende på projektilen (figur i art.ts). */
  projektil: string;
  /** Hur långt man kan dra bakåt, i punkter. */
  maxDrag: number;
  /** Utgångsfart per punkt dragning. */
  kraft: number;
  /** Bromsning per steg i luften och på marken. */
  friktion: { luft: number; mark: number };
  /** Hur länge projektilen flyger (i fysiksteg) vid svagaste och starkaste skott. */
  flygtid: { min: number; max: number };
  /** Sidvind/slice som verkar medan projektilen är i luften. */
  vind: { x: number; y: number; etikett: string };
  /** Den del av skärmen där projektilen är i spel. Utanför = ute. */
  spelplan: { x: number; y: number; b: number; h: number };
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
  };
  skott: {
    /** "slapp" = skjuter när fingret släpps, "auto" = skjuter hela tiden medan fingret är nere. */
    lage: 'slapp' | 'auto';
    /** Minsta tid mellan två skott (ms). */
    intervall: number;
    /** Skottets fart uppåt (punkter per sekund). */
    fart: number;
  };
  brickor: {
    /** Rader uppifrån och ner. null = tom plats. */
    rader: (BrickData | null)[][];
    b: number;
    h: number;
    mellanrum: number;
    /** Valfri sidförskjutning (punkter) per rad, t.ex. [0, 35] för en halv bricka på rad 2. */
    forskjutning?: number[];
    /** Översta radens överkant vid start. Rutnätet centreras i sidled. */
    startY: number;
    /** Rörelse: steg i sidled (punkter), steg nedåt vid kanten, tid mellan stegen (ms). */
    steg: { x: number; ned: number; intervall: number };
    /** Hur långt ut rutnätet får gå (x för vänster och höger kant). */
    kant: { vanster: number; hoger: number };
    /** Rita tomma platser (null) som streckade rutor. */
    visaTomma?: boolean;
  };
  /** Saker som faller och ska fångas (valfritt). */
  fangst?: FangstData[];
  /** Block som stoppar spelarens skott (valfritt). */
  skydd?: SkyddData[];
  /** Nedräkning (valfritt). */
  tid?: { sekunder: number; etikett: string };
  matare: {
    namn: string;
    /** Antal steg innan mätaren är full. */
    steg: number;
    /** Valfri text till höger i mätarraden. */
    status?: string;
  };
  /** Hur många steg mätaren stiger per misstag av varje slag. */
  misstag: { rattTraffad: number; fangstMissad: number };
  /** Rutan under rubriken, t.ex. "Rätt rubrik: KROGKUNG". Första står till vänster, sista till höger. */
  info?: { etikett: string; varde: string; serif?: boolean }[];
  /** Kort instruktion mitt på planen som tonas bort efter några sekunder. */
  instruktion?: { text: string; y: number };
  /** Alla villkor måste vara uppfyllda för vinst. */
  vinst: ('fel-borta' | 'alla-fangade')[];
  /** Något av villkoren ger förlust. */
  forlust: ForlustOrsak[];
  /** Vid vinst: brickor och fångstobjekt med "plats" flyttas till en rad på denna höjd. */
  slutrad?: { y: number };
}

export interface BrickData {
  etikett: string;
  /** "fel" ska skjutas bort, "ratt" får inte skjutas. */
  typ: 'fel' | 'ratt';
  /** Plats i slutraden (0 = först). */
  plats?: number;
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
