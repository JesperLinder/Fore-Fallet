/**
 * Nivåformatet. Nivåerna ligger i kapitelmappar, src/levels/kapitel-N/, med en kapitelfil (kapitel.json,
 * se KapitelFil) och en fil per nivå. Varje nivåfil följer antingen NivaPlatshallare (låst nivå som bara syns
 * på kartan) eller Niva (fullständig, spelbar nivå). En ny nivå ska aldrig kräva ny kod – bara en ny fil.
 */
import type { FargNamn } from '../config/theme';

/** "boss" är reserverad för kapitel 2:s bossnivå (Potatispartiet), som inte är byggd än. */
export type MekanikTyp = 'slingshot' | 'invaders' | 'hybrid' | 'memory' | 'boss';
export type Resultat = 'vinst' | 'halvvagsvinst';

/** Kapitelfilen, src/levels/kapitel-N/kapitel.json. */
export interface KapitelFil {
  /** Unikt id, t.ex. "kapitel-1". Framstegen sparas per kapitel-id – byt det aldrig när spelet är ute. */
  id: string;
  /** Kapitlens ordning (1, 2, 3 …). */
  nummer: number;
  titel: string;
  undertitel: string;
  /** Kapitlets accentfärg, en av profilfärgerna (t.ex. "guld" eller "lila"). */
  farg: FargNamn;
  /** Nivåernas id i spelordning. Varje nivåfil i mappen ska finnas med här. */
  nivaer: string[];
}

/**
 * Minsta möjliga nivåfil: räcker för att synas (låst) på kartan. Bara id, titel och mekanik krävs.
 * Nivånumret räknas fram ur ordningen i kapitelfilen (ett "nummer" i filen används bara för kontroll).
 */
export interface NivaPlatshallare {
  id: string;
  nummer: number;
  titel: string;
  referens?: string;
  mekanik: MekanikTyp;
  fylgiaMal?: boolean;
  /** Valfri etikett på kartan i stället för mekanikens namn, t.ex. "Boss" eller "Final". Låsta nivåer visar den till höger. */
  etikett?: string;
  /** Rättsområde, t.ex. "Köprätt". Visas på kartan efter referensen i stället för mekanikens namn. */
  rattsomrade?: string;
  /** Märke på kartan efter titeln, t.ex. { "text": "Memory", "farg": "lila" } eller { "text": "Boss", "farg": "guld" }. */
  kartmarke?: { text: string; farg: FargNamn };
  /** Nivån är inte byggd än: visas låst på kartan med "Kommer snart" (även i testläget). */
  kommerSnart?: boolean;
}

/** En fullständig, spelbar nivå. */
export interface Niva extends NivaPlatshallare {
  referens: string;
  fylgiaMal: boolean;
  uppdragstext: string;
  fylgiaTips: string;
  resultat: Resultat;
  /** Poäng som krävs för 1, 2 och 3 stjärnor (slangbella). Ange detta ELLER stjarnkrav. */
  stjarngranser?: { en: number; tva: number; tre: number };
  /** Krav för 1, 2 och 3 stjärnor räknat på misstag och tid kvar (invaders). Nivån måste vara klarad. */
  stjarnkrav?: { en: StjarnKrav; tva: StjarnKrav; tre: StjarnKrav };
  /**
   * Valfri extra guldstjärna utöver de tre, för en särskild bedrift (t.ex. rädda alla kor).
   * Räknas inte i stjärnräknaren och påverkar inte upplåsningen. text: visas på domslutet.
   */
  guldstjarna?: { krav: StjarnKrav; text: string };
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
  /** Inställningar för memory – krävs när mekanik är "memory". Se MemoryInstallningar och _mall-memory.md. */
  memory?: MemoryInstallningar;
  /** Förlustskärmen, för mekaniker där man kan förlora. */
  forlust?: Forlust;
  domslut: Domslut;
  /** Guldmärke efter nivåetiketten i rubriken, t.ex. "BOSS". */
  rubrikmarke?: string;
  /** Märkets färg (standard "guld"), t.ex. "lila" för "Memory". */
  rubrikmarkeFarg?: FargNamn;
  /** Svart mellanstopp i en sekund innan nivån visas, t.ex. "BOSS – NJA 1997 s. 660". */
  mellanstopp?: string;
  /** Läggs till efter referensen i nivåetiketten, t.ex. "Final" ger "NIVÅ 10 · HD 2023 · FINAL". */
  overrubrikTillagg?: string;
}

export interface StjarnKrav {
  /** Högst så här många misstag. */
  maxMisstag?: number;
  /** Mer än så här många sekunder kvar på klockan. */
  tidKvarOver?: number;
  /** Vann på högst så här många försök (hybrid: kast med vinnarprojektilen). */
  maxForsok?: number;
  /** Vann på högst så här många drag (memory: ett drag = två vända kort). */
  maxDrag?: number;
  /** Gick i högst så här många fällor (hybrid: kast med en fälla, t.ex. avtalet). */
  maxFallor?: number;
  /** Minst så här många procent kvar på mätaren (invaders, t.ex. "God tro" 75). */
  minMatare?: number;
  /** Högst så här många dekorfigurer förlorade (invaders, t.ex. 0 = alla kor kvar i hagen). */
  maxDekorForlorade?: number;
  /** Högst så här många i namngivna räknare (invaders: onHit/onPass med "raknas"), t.ex. { "missad": 1 }. */
  maxAntal?: Record<string, number>;
  /** Minst så här många i namngivna räknare, t.ex. { "matare": 1 } (slangbella: block med "raknas"). */
  minAntal?: Record<string, number>;
}

export type ForlustOrsak = 'matare-full' | 'tid-slut' | 'botten' | 'skott-slut';

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

/**
 * Fysikblock (slangbella i sidovy): en vanlig Matter-kropp som kan staplas, välta och falla.
 * x, y = mittpunkt. Blocken sover tills något träffar dem, så att de ligger helt still vid start.
 */
export interface BlockObjekt extends BasObjekt {
  typ: 'block';
  /** Valfritt namn, för vinstvillkoret "block:<id>" och plattformar. */
  id?: string;
  b: number;
  h: number;
  /** Täthet (Matter density). Papper ca 0.0002, trä ca 0.001, metall ca 0.003. */
  vikt: number;
  /** Figur i art.ts, t.ex. "faktura" eller "elmatare". */
  utseende: string;
  /** Text på blocket, t.ex. "År 1". */
  etikett?: string;
  /** Färg på etiketten. Standard: mörkgrön. */
  etikettFarg?: FargNamn;
  /** Räknas i räknaren och i vinstvillkoret "alla-block". */
  mal?: boolean;
  /** Räknas i en namngiven räknare när blocket slagits ned, för stjarnkrav.minAntal/maxAntal. */
  raknas?: string;
  /** Pratbubbla när blocket slagits ned, t.ex. "År 3: borta". */
  nedText?: string;
  /** Fladdrar som papper när det faller: lätt rotation och sidodrift. Ger också prassel vid träff. */
  papper?: boolean;
  /** Ljud när blocket landar efter att ha slagits ned, t.ex. "klonk". */
  landningsljud?: 'klonk';
  /** Plattformen (id) blocket står på. Lämnar blocket plattformen räknas det som nedslaget. */
  plattform?: string;
  /** Fast block som inte faller (t.ex. en boss). Kan göras rörligt av bogserläget. */
  statisk?: boolean;
  /** Studs (restitution, 0–1). Standard 0.05; högt värde får projektiler att studsa tillbaka. */
  studs?: number;
  /** Flyter: guppar upp och ner (hojd i punkter, period i ms) och står kvar på samma höjd när det dras. */
  gupp?: { hojd: number; period: number };
}

/** Statisk plattform som block kan stå på (sidovy). x, y = mittpunkt. */
export interface PlattformObjekt extends BasObjekt {
  typ: 'plattform';
  id: string;
  b: number;
  h: number;
  farg: FargNamn;
  /** Valfri text under plattformen, t.ex. "FAKTURA ÅR 1–4". */
  etikett?: string;
}

/**
 * Studsmål (slangbella i sidovy): ett fast objekt (t.ex. en domstol) som stöter bort projektilen och säger något.
 * x, y = mittpunkt; b, h = träffytan. studs: "fysik" (vanlig studs) eller { mot: id } (projektilen skickas i en båge
 * mot ett annat studsmål). Ett slutmål startar en scriptad händelse (se Slutmal) och avslutar kastet.
 */
export interface StudsmalObjekt extends BasObjekt {
  typ: 'studsmal';
  id: string;
  b: number;
  h: number;
  /** Figur i art.ts, t.ex. "tingsratt". Ritas med b × h. */
  utseende: string;
  /** Namn ovanför målet, t.ex. "Södertörns tingsrätt". */
  etikett?: string;
  etikettFarg?: FargNamn;
  /** Pratbubbla när projektilen träffar (en gång per kast). */
  text?: string;
  studs?: 'fysik' | { mot: string };
  slut?: Slutmal;
}

/** Scriptad händelse när ett slutmål träffas: valfri stämpel, sedan en båge till ett annat mål, svar och upplysning. */
export interface Slutmal {
  /** Text i en guldstämpel på projektilen, t.ex. "FASTIGHETSFORUM". */
  stampel?: string;
  /** id på studsmålet projektilen flyger till, hur lång tid bågen tar (ms) och hur högt den går (y för toppen). */
  till: string;
  tid: number;
  topp: number;
  /** Pratbubbla från mottagaren, t.ex. "Åh. Då är den vår." */
  svar?: string;
  /** En figur som tonas in ovanpå scenen när projektilen landat (t.ex. lokalen som lyser upp). */
  lys?: { utseende: string; x: number; y: number; b: number; h: number };
}

export type NivaObjekt =
  | StudsmalObjekt
  | BlockObjekt
  | PlattformObjekt
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
    /** Var vindindikatorn står (övre vänstra hörnet). Standard: x 16, y 166. */
    plats?: { x: number; y: number };
  };
  /** Hur stor del (0–1) av flygbanan den prickade siktlinjen visar. 1 = hela vägen till landning (standard). */
  siktlinje?: number;
  /** Den del av skärmen där projektilen är i spel. Utanför = ute. */
  spelplan: { x: number; y: number; b: number; h: number };
  /**
   * Sidovy (valfritt): banan ses från sidan med riktig gravitation, och projektilen är en vanlig Matter-kropp
   * som studsar mot marken och fysikblock. Utan sidvy ses banan uppifrån (som nivå 1 och 3).
   */
  sidvy?: {
    /** Gravitation nedåt (Matter, 1 = jordlik). */
    gravitation: number;
    /** Markens överkant (y). Under den finns en fast markkropp. */
    mark: number;
    /** Projektilens radie och täthet (standard 10 och 0.004). */
    radie?: number;
    vikt?: number;
  };
}

export interface SlangbellaInstallningar extends KastInstallningar {
  /** Antal skott. */
  antal: number;
  /** Utseende på projektilen (figur i art.ts). */
  projektil: string;
  /** Valfritt namn under slangbellan, t.ex. "Ansvarsstjärnan". */
  projektilNamn?: string;
  /** Rubriker i resultatraden (nivå 1). Utelämnas = ingen resultatrad. */
  hud?: { matare: string; projektiler: string; kostnad: string };
  /** Räknare uppe till höger för block med "mal", t.ex. { "rubrik": "Efterdebitering", "text": "{kvar} år" }. */
  raknare?: { rubrik: string; text: string };
  /** Valfri ruta under rubriken med uppdraget. */
  infotext?: string;
  /** Längst ner visas bara Fylgia-tipset (kort ruta) i stället för uppdrag + tips. Passar ihop med infotext. */
  tipsUnderSpel?: boolean;
  /**
   * Vinstvillkor för fysikblock (alla måste gälla): "alla-block" = alla block med "mal" nedslagna,
   * "block:<id>" = ett visst block nedslaget, "slutmal" = ett slutmål träffat och dess scriptade händelse klar. Med vinst är nivån förlorad om skotten tar slut innan (orsak "skott-slut").
   * Utelämnas = nivån tar slut efter sista skottet och stjärnorna räknas på poäng (som nivå 1).
   */
  vinst?: string[];
  /** Block vars mittpunkt hamnar under den här linjen (y) räknas som nedslagna. */
  nedLinje?: number;
  /**
   * Valfritt: ett utseende och en etikett per skott i tur och ordning (t.ex. tre argument). svar = repliken
   * som blocket "svarFran" ger när just det skottet träffar det. Antalet skott är fortfarande "antal".
   */
  projektiler?: { utseende?: string; etikett: string; svar?: string }[];
  /** id på blocket som svarar på projektilernas "svar" (pratbubbla i 2,5 sekunder). */
  svarFran?: string;
  /** Sista repliken från samma block, efter det sista skottets svar. */
  slutreplik?: string;
  /** Bossmätare överst: namn, statustext och text som blinkar till vid varje träff. Den är alltid full. */
  bossMatare?: { namn: string; status: string; blinkText: string };
  /** Bakgrundsmusik under nivån (Web Audio), t.ex. "boss". */
  musik?: 'boss';
  /** Bogserläget: styr ett fordon och dra ett tungt block över en linje. Se BogseraInstallningar. */
  bogsera?: BogseraInstallningar;
}

/**
 * Bogserläget i slangbellan (sidovy): spelaren drar med fingret och fordonet (t.ex. en bogserbåt) följer efter.
 * Fordonet kopplas med ett elastiskt rep till ett block (som då blir rörligt och mycket tungt). Vinst när blockets
 * mittpunkt passerat gränsen; förlust (orsak "tid-slut") om tiden tar slut.
 */
export interface BogseraInstallningar {
  /** När läget blir tillgängligt: "direkt" från start, "knapp" (knappen finns från start), eller "efter-skott" (när skotten är slut). */
  aktivering: 'direkt' | 'knapp' | 'efter-skott';
  /** Knappen: text och efter hur många skott den börjar pulsera (högst en puls per sekund). */
  knapp?: { text: string; pulseraEfterSkott?: number };
  fordon: {
    utseende: string;
    b: number;
    h: number;
    /** Var fordonet ligger innan läget startar, och var det kopplas (åker dit när läget startar). */
    start: { x: number; y: number };
    koppling: { x: number; y: number };
    /** Högsta fart (punkter per fysiksteg). */
    fart: number;
    /** Hur högt och lågt fordonet får gå (y), t.ex. vattenytan. */
    y: { min: number; max: number };
  };
  /** id på blocket som ska dras, dess massa och luftmotstånd (lågt = svårt att stoppa). */
  objekt: string;
  massa: number;
  luft: number;
  /** Repet: fästpunkt på blocket (relativt dess mitt), längd, styvhet (0–1, lågt = elastiskt) och dämpning. */
  rep: { fast: { x: number; y: number }; langd: number; styvhet: number; dampning?: number };
  /**
   * Gränsen blocket ska passera: x, från y1 till y2, och etikett. matpunkt: "framkant" (standard, blockets
   * högra kant passerar) eller "mitt" (blockets mittpunkt passerar).
   */
  grans: { x: number; y1: number; y2: number; etikett: string; matpunkt?: 'framkant' | 'mitt' };
  /** Tidsgräns i sekunder från att läget startat. */
  tid: number;
  /** Vid vinst: utseenden blocket byter till i tur och ordning (t.ex. förvånad, nöjd) och en text. */
  vinst: { text: string; utseenden?: string[] };
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
  /** Spelarens skott. Behövs inte i sköldläge (skold), där spelaren inte skjuter. */
  skott?: {
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
    /**
     * Bricktyperna. Varje bricka i "rader" anger en typ (nyckel här), och typen bestämmer hur brickan ser ut,
     * vad som händer vid träff (onHit) och när den når spelaren (onPass).
     */
    typer: Record<string, BrickTyp>;
    /** Valfri figur (art.ts) på varje bricka, med etiketten i liten text under, t.ex. "bilsiluett". */
    ikon?: string;
    /** Rita bara den här figuren (art.ts), utan ruta och etikett, t.ex. "ufo". */
    figur?: string;
    /** Skotten passerar igenom brickorna (de kan inte skjutas ner), t.ex. ufon. */
    skottGenom?: boolean;
    /**
     * Valfria fler vågor. När alla brickor i en våg är klara (borta eller släppta igenom) kommer nästa.
     * Fälten ersätter motsvarande fält i "brickor" (t.ex. rader, steg, mellanrum). text: pratbubbla vid start.
     */
    vagor?: (Partial<RutnatInstallningar<BrickData>> & { text?: string })[];
  };
  /** Fallande hot som ska skjutas ner innan de når botten (valfritt). */
  hot?: HotInstallningar;
  /**
   * Sköldläge (valfritt): spelaren skjuter inte utan styr "spelare" som en sköld i sidled. Skölden blockerar
   * allt den träffar, t.ex. fiendernas märkta projektiler (skyttar). etikett: text under skölden.
   */
  skold?: { etikett?: string };
  /** Det som ska skyddas under skölden (figur i art.ts). ledsen: figur som visas en stund vid fel (utfall.ledsen). */
  skyddas?: { utseende: string; ledsen?: string; x: number; y: number; b: number; h: number; etikett?: string };
  /** Skyttar som skjuter märkta projektiler mot det som skyddas, med regler för vad som ska blockeras. */
  skyttar?: SkyttarInstallningar;
  /** Liten mörk ruta uppe till höger med rubrik och text, t.ex. "PLENUM / Alla justitieråd". */
  hornruta?: { rubrik: string; text: string };
  /** Kort förklaring i steg (tryck för nästa) första gången nivån spelas. Visas inte när nivån redan är klarad. */
  introSteg?: string[];
  /** Bakgrundshändelser som spelaren inte kan påverka, med valfri räknare (valfritt). */
  dekor?: DekorInstallningar;
  /** Valfri text (pratbubbla) när ett fångstobjekt missas. */
  misstagText?: { fangstMissad?: string };
  /** Valfri ruta under rubriken med en längre text, t.ex. uppdraget. */
  infotext?: string;
  /** Visa Fylgia-tipset i en ruta längst ner medan man spelar (inte bara i startrutan). */
  tipsUnderSpel?: boolean;
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
     * "antal": en räknare uppe till höger: namnet (t.ex. "INTRÅNG") över en vinröd siffra. Tar klockans plats.
     */
    visning?: 'steg' | 'procent' | 'kort' | 'antal';
  };
  /** Hur många steg mätaren stiger när ett fångstobjekt missas (bara nivåer med "fangst"). */
  misstag?: { fangstMissad: number };
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

/** En bricktyp i invaders: utseende och regler. Se _mall-invaders.md. */
export interface BrickTyp {
  /** "ljus": beige ruta med mörk text (grön med ikon). "mork" (standard): vinröd ruta med lila kant. */
  stil?: 'ljus' | 'mork';
  /** Figur (art.ts) i stället för ruta, med etiketten i liten text under, t.ex. "tub-egen". */
  figur?: string;
  /** Färg på etiketten under figuren. Standard: mörkgrön. */
  etikettFarg?: FargNamn;
  /** Träffytan krymps så här många punkter på varje sida, så att skott som nästan går fri släpps igenom. */
  smalTraff?: number;
  /** Räknas i vinstvillkoret "fel-borta": alla brickor av den här typen ska vara borta. */
  skaBort?: boolean;
  /** Vid träff. Utelämnas = skottet stoppas, inget händer. */
  onHit?: TraffRegel;
  /** När brickan når spelaren. Utelämnas = brickan stannar kvar (och ger förlusten "botten" om den används). */
  onPass?: BottenRegel;
  /** Som onPass, men om brickan fortfarande är dold (reveal). Utelämnas = onPass. */
  onPassDold?: BottenRegel;
}

/** Vad som händer när ett skott träffar en bricka. */
export interface TraffRegel {
  /** "ta-bort": brickan försvinner. "fyll": fylls (nivån stiger) och lämnar uppåt. "skaka": skakar, ligger kvar. */
  effekt: 'ta-bort' | 'fyll' | 'skaka';
  poang?: number;
  /** Steg på mätaren. */
  matare?: number;
  /** Räknas som ett misstag (stjarnkrav.maxMisstag), med blink och skakning. */
  misstag?: boolean;
  /** Pratbubbla vid träffen, t.ex. "Annans märke! Intrång.". */
  text?: string;
  /** Räknas i en namngiven räknare, för stjarnkrav.maxAntal. */
  raknas?: string;
  /** Bara "ta-bort": brickans "ersattning" dyker upp på samma plats, som en bricka av den här typen. */
  ersattTyp?: string;
}

export interface BrickData {
  etikett: string;
  /** Bricktyp: en nyckel i brickor.typer, t.ex. "fel", "ratt" eller "egen". */
  typ: string;
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

/**
 * Skyttar (invaders, sköldläge): fiender som skjuter märkta projektiler mot det som skyddas. Varje projektil har en
 * typ (med kategori) och en märkning (t.ex. vilken deklaration den gäller). Kategorins regel avgör om den ska
 * blockeras eller släppas igenom; fel ger utfallet vidFelBlock eller vidFelSlapp.
 */
export interface SkyttarInstallningar {
  skyttar: {
    id: string;
    etikett: string;
    /** Figur i art.ts i guld, t.ex. "dokument". */
    ikon?: string;
    /** Rutans mittpunkt och storlek. Projektilerna skjuts från rutans underkant. */
    x: number;
    y: number;
    b: number;
    h: number;
    /** Vilka typer skytten skjuter, med vikt (sannolikhet). */
    typer: { typ: string; vikt: number }[];
  }[];
  /** Projektiltyperna: etikett, färg, valfri streckad kant och kategori (nyckel i kategorier). */
  typer: Record<string, { etikett: string; farg: FargNamn; streckad?: boolean; kategori: string }>;
  /** Märkningarna, t.ex. ["A", "B", "C"]. Varje projektil får en slumpvis. */
  markningar: string[];
  /**
   * Regel per kategori. "en-per-markning": den första som träffar per märkning ska släppas igenom, resten blockeras.
   * "slapp-alltid": ska alltid släppas igenom. "blockera-alltid": ska alltid blockeras.
   */
  kategorier: Record<string, { regel: 'en-per-markning' | 'slapp-alltid' | 'blockera-alltid'; vidFelBlock?: Utfall; vidFelSlapp?: Utfall }>;
  /** Fart (punkter per sekund), tid mellan skotten i början och i slutet (ms) och väntetid före första skottet. */
  fart: number;
  intervall: number;
  slutIntervall: number;
  fordrojning?: number;
  /** Flera samtidigt mot slutet: från en viss andel av tiden (0–1), så många per gång. */
  samtidigt?: { fran: number; antal: number }[];
  /** Var projektilerna siktar (mittpunkt) och hur mycket de sprids i sidled. */
  mal: { x: number; y: number; spridning: number };
  /** Flikar som visar märkningarna och lyser när en "en-per-markning"-märkning fått sin första träff. */
  flikar?: { x: number; y: number; prefix: string; rubrik?: string };
}

/** Konsekvens av ett fel: steg på mätaren (misstag), pratbubbla och hur länge det skyddade ser ledset ut (ms). */
export interface Utfall {
  matare: number;
  text?: string;
  ledsen?: number;
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
    /**
     * Valfritt: spelaren kan avbryta händelsen genom att skjuta källan (t.ex. ufot) medan den pågår.
     * Figuren faller då tillbaka till sin plats. text: pratbubbla när det lyckas, t.ex. "Kon räddad!".
     */
    raddning?: { text?: string };
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
  /** Räknas i en namngiven räknare, för stjarnkrav.maxAntal (t.ex. "missad"). */
  raknas?: string;
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
  /** Skyltar som pendlar i sidled och stoppar det som kastas (t.ex. "Kvarstad"). Valfritt. */
  hinder?: HybridHinder[];
}

export interface HybridHinder {
  /** Text på skylten. */
  etikett: string;
  /** Skyltens mittpunkt vid start, och storlek. */
  x: number;
  y: number;
  b: number;
  h: number;
  /** Pendlar mellan x och tillX (mittpunkter) med farten fart (punkter per sekund). Utelämnas = står still. */
  tillX?: number;
  fart?: number;
  /** Pratbubbla första gången något fastnar, t.ex. "Kvarstad! Hästen hölls kvar". */
  text?: string;
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

// ---------- Memory ----------

/** Ett kort (eller flera likadana, med "antal") i memoryt. */
export interface MemoryKort {
  /** Text på framsidan. */
  etikett: string;
  /**
   * Parnyckeln: två kort med samma nyckel är ett par. Korten behöver inte vara likadana
   * (t.ex. "Mögellukt" + "Fuktskadan", eller vänster och höger halva av ett papper).
   */
  par: string;
  /** Antal likadana kort (standard 1). Ett par av två likadana kort: "antal": 2. */
  antal?: number;
  /** Framsidans färg (standard "ljusbeige"). Texten blir ljus på mörka färger. */
  farg?: FargNamn;
  /** Valfri symbol ovanför texten, från mechanics/memory/forms.ts (t.ex. "tak", "dorr", "droppe"). */
  form?: string;
  /** Valfri färgad kant när kortet är vänt, t.ex. "guld". */
  kant?: FargNamn;
  /** Valfri effekt när kortet vänds upp (se MemoryEffekt). */
  effekt?: MemoryEffekt;
}

/**
 * Specialeffekt när ett kort vänds upp. Finns: "dimma" (dimma över korten runt omkring i "sekunder";
 * "avstand" 1 = de närmaste, även diagonalt; de kan inte vändas under tiden) och "blanda" (blandar om alla
 * kort som inte är hittade, när draget är klart). Nya effekter läggs till i EFFEKTER i mechanics/Memory.ts.
 */
export interface MemoryEffekt {
  typ: string;
  sekunder?: number;
  avstand?: number;
}

export interface MemoryInstallningar {
  kolumner: number;
  rader: number;
  kort: MemoryKort[];
  /** Rubrikerna i HUD:en, t.ex. { "par": "Par", "drag": "Drag" }. */
  hud: { par: string; drag: string };
  /** Valfri tidsgräns: { "sekunder": 75, "etikett": "Tid kvar" }. */
  tid?: { sekunder: number; etikett: string };
  /** Valfri mätare som fylls ett steg per miss, t.ex. { "namn": "Misstanke", "steg": 5 }. Full mätare kan ge förlust. */
  matare?: { namn: string; steg: number };
  /** Mörkgrön ruta under HUD:en med nivåns förklaring. */
  infotext?: string;
  /** Rader under rutnätet. "typ": "hittat" (hittat par), "kort" (ett kort i "farg") eller "dimma". */
  teckenforklaring?: { typ: 'hittat' | 'kort' | 'dimma'; text: string; farg?: FargNamn }[];
  /** Vinstvillkor. Finns: "alla-par". */
  vinst: 'alla-par';
  /** Förlustvillkor: "tid-slut" (tiden tog slut) och/eller "matare-full" (mätaren full). */
  forlust: ('tid-slut' | 'matare-full')[];
  /** Hur länge två kort som inte matchar ligger uppe (ms, standard 800). */
  vandTillbakaMs?: number;
  /** Visa fylgians tips längst ner under spelet (efter "Starta"). */
  tipsUnderSpel?: boolean;
}
