/**
 * Spelets ljudmodul: alla ljudeffekter och musiken, genererade med Web Audio (inga ljudfiler).
 * - Allt går genom en huvudvolym (HUVUDVOLYM) och en mjuk begränsare, så att flera ljud samtidigt inte spräcks.
 * - UTJAMNING jämnar ut nivåerna mellan ljuden (uppmätt med K-vägd ljudstyrka, se README "Ljud").
 * - iOS: ljudet låses upp vid första tryck på skärmen (laasUppLjud, anropas från main.ts), så att det fungerar
 *   redan från startskärmens "Spela". Ljudet pausas när appen går i bakgrunden.
 * Ljudet kan stängas av på kartan; valet sparas via progress.ts och stänger också av vibrationen.
 */
import { framsteg } from './progress';
import { vibrera } from '../platform/haptics';

export type Ljud = 'skott' | 'traff' | 'fanga' | 'misstag' | 'vinst' | 'stampel' | 'muu' | 'pssst' | 'prassel' | 'klonk' | 'duns' | 'jubel' | 'flipp' | 'par' | 'miss' | 'pling' | 'mynt' | 'snip' | 'krasch' | 'hammare' | 'tick' | 'plopp' | 'ding' | 'avslojande';
type Tonljud = Exclude<Ljud, 'pssst' | 'prassel' | 'krasch'>;

interface Ton {
  /** Frekvens i Hz vid start och slut (glidning). */
  fran: number;
  till: number;
  /** Start i sekunder efter anropet, och längd. */
  start: number;
  langd: number;
  form: OscillatorType;
  volym: number;
}

const LJUD: Record<Tonljud, Ton[]> = {
  skott: [{ fran: 880, till: 440, start: 0, langd: 0.07, form: 'square', volym: 0.05 }],
  traff: [{ fran: 520, till: 180, start: 0, langd: 0.12, form: 'triangle', volym: 0.14 }],
  fanga: [
    { fran: 660, till: 660, start: 0, langd: 0.08, form: 'sine', volym: 0.14 },
    { fran: 990, till: 990, start: 0.07, langd: 0.12, form: 'sine', volym: 0.12 },
  ],
  // Torrt klick + dovt tryck, som en stämpel i papper.
  stampel: [
    { fran: 1400, till: 500, start: 0, langd: 0.025, form: 'square', volym: 0.06 },
    { fran: 140, till: 70, start: 0.01, langd: 0.07, form: 'sine', volym: 0.2 },
  ],
  // Ett kort, löjligt "muu" som glider uppåt och tonas ut (kon lyfts).
  muu: [
    { fran: 150, till: 135, start: 0, langd: 0.22, form: 'sawtooth', volym: 0.05 },
    { fran: 135, till: 330, start: 0.2, langd: 0.55, form: 'sawtooth', volym: 0.035 },
  ],
  // Torrt "klonk": kort fyrkantston som faller, och en dov duns under.
  klonk: [
    { fran: 330, till: 160, start: 0, langd: 0.06, form: 'square', volym: 0.07 },
    { fran: 110, till: 60, start: 0, langd: 0.12, form: 'triangle', volym: 0.25 },
  ],
  // Kort jubel: stigande toner när något landar rätt.
  jubel: [
    { fran: 523, till: 523, start: 0, langd: 0.1, form: 'triangle', volym: 0.12 },
    { fran: 659, till: 659, start: 0.08, langd: 0.1, form: 'triangle', volym: 0.12 },
    { fran: 784, till: 784, start: 0.16, langd: 0.1, form: 'triangle', volym: 0.12 },
    { fran: 1047, till: 1047, start: 0.24, langd: 0.12, form: 'triangle', volym: 0.12 },
    { fran: 1319, till: 1568, start: 0.34, langd: 0.3, form: 'triangle', volym: 0.11 },
  ],
  // Dovt "duns" när något träffar (sköldläge).
  duns: [{ fran: 95, till: 45, start: 0, langd: 0.22, form: 'sine', volym: 0.3 }],
  misstag: [{ fran: 180, till: 90, start: 0, langd: 0.28, form: 'sawtooth', volym: 0.07 }],
  // Memory: mjukt "flipp" när ett kort vänds – två korta, mjuka toner som glider uppåt.
  flipp: [
    { fran: 420, till: 640, start: 0, langd: 0.05, form: 'sine', volym: 0.1 },
    { fran: 700, till: 900, start: 0.035, langd: 0.05, form: 'sine', volym: 0.06 },
  ],
  // Memory: ljust ackord (dur) när ett par hittas.
  par: [
    { fran: 784, till: 784, start: 0, langd: 0.3, form: 'triangle', volym: 0.06 },
    { fran: 988, till: 988, start: 0.02, langd: 0.3, form: 'triangle', volym: 0.06 },
    { fran: 1175, till: 1175, start: 0.04, langd: 0.32, form: 'triangle', volym: 0.06 },
    { fran: 1568, till: 1568, start: 0.06, langd: 0.3, form: 'sine', volym: 0.03 },
  ],
  // Memory: dovt ljud när två kort inte matchar.
  miss: [
    { fran: 210, till: 150, start: 0, langd: 0.2, form: 'triangle', volym: 0.16 },
    { fran: 160, till: 110, start: 0.12, langd: 0.22, form: 'triangle', volym: 0.12 },
  ],
  // Kassaapparatens "pling": ett kort mekaniskt klick och en ljus klocka med två deltoner.
  pling: [
    { fran: 1800, till: 900, start: 0, langd: 0.02, form: 'square', volym: 0.04 },
    { fran: 2093, till: 2093, start: 0.03, langd: 0.45, form: 'sine', volym: 0.09 },
    { fran: 2637, till: 2637, start: 0.03, langd: 0.32, form: 'sine', volym: 0.05 },
    { fran: 4186, till: 4186, start: 0.03, langd: 0.12, form: 'sine', volym: 0.02 },
  ],
  // Mynt: två snabba, ljusa toner (ett "kling-ling").
  mynt: [
    { fran: 988, till: 988, start: 0, langd: 0.07, form: 'square', volym: 0.04 },
    { fran: 1319, till: 1319, start: 0.065, langd: 0.28, form: 'square', volym: 0.04 },
  ],
  // Häcksaxens "snip": två korta, ljusa klick (bladen som möts).
  snip: [
    { fran: 3200, till: 1800, start: 0, langd: 0.018, form: 'square', volym: 0.05 },
    { fran: 2600, till: 1400, start: 0.045, langd: 0.022, form: 'square', volym: 0.06 },
  ],
  // Lågt "tick" när bevismätaren stiger: en kort, mjuk ton med ett litet klick.
  tick: [
    { fran: 1500, till: 1200, start: 0, langd: 0.012, form: 'square', volym: 0.03 },
    { fran: 330, till: 300, start: 0, langd: 0.07, form: 'sine', volym: 0.2 },
  ],
  // Torrt "plopp" när ett dåligt ägg skjuts bort: en kort ton som faller snabbt.
  plopp: [
    { fran: 620, till: 180, start: 0, langd: 0.07, form: 'sine', volym: 0.24 },
    { fran: 2400, till: 1200, start: 0, langd: 0.012, form: 'square', volym: 0.03 },
  ],
  // Kort "ding" var 1 000:e portion: en ljus klocka.
  ding: [
    { fran: 1760, till: 1760, start: 0, langd: 0.35, form: 'sine', volym: 0.08 },
    { fran: 3520, till: 3520, start: 0, langd: 0.12, form: 'sine', volym: 0.02 },
  ],
  // Lågt, dovt ackord vid avslöjandet (moll), långsamt avtonat.
  avslojande: [
    { fran: 110, till: 110, start: 0, langd: 1.4, form: 'triangle', volym: 0.2 },
    { fran: 130.8, till: 130.8, start: 0.03, langd: 1.4, form: 'triangle', volym: 0.15 },
    { fran: 164.8, till: 164.8, start: 0.06, langd: 1.4, form: 'triangle', volym: 0.12 },
    { fran: 55, till: 55, start: 0, langd: 1.2, form: 'sine', volym: 0.18 },
  ],
  // Hammarslag: ett torrt klick och en kort, dov smäll.
  hammare: [
    { fran: 1100, till: 600, start: 0, langd: 0.02, form: 'square', volym: 0.06 },
    { fran: 190, till: 85, start: 0, langd: 0.1, form: 'triangle', volym: 0.28 },
  ],
  vinst: [
    { fran: 523, till: 523, start: 0, langd: 0.14, form: 'triangle', volym: 0.13 },
    { fran: 659, till: 659, start: 0.12, langd: 0.14, form: 'triangle', volym: 0.13 },
    { fran: 784, till: 784, start: 0.24, langd: 0.14, form: 'triangle', volym: 0.13 },
    { fran: 1047, till: 1047, start: 0.36, langd: 0.32, form: 'triangle', volym: 0.12 },
  ],
};

/** Huvudvolymen för allt ljud (0–1). */
export const HUVUDVOLYM = 0.8;

/**
 * Utjämning per ljud: faktor på tonernas volym så att alla ligger på ungefär samma upplevda styrka
 * (inom ±1 dB; mätt över det starkaste 100 ms-fönstret med scripts i README "Ljud"). Musiken ligger medvetet lägre.
 */
const UTJAMNING: Record<Ljud | 'musik', number> = {
  // Mål −31 (medel av K-vägd och "telefonhögtalare" med högpass 180 Hz). Skottet ligger 3 dB lägre med flit:
  // det hörs ofta, ibland flera gånger i sekunden.
  skott: 1.91,
  traff: 1.24,
  fanga: 0.88,
  misstag: 1.84,
  vinst: 0.87,
  stampel: 1.1,
  muu: 2.74,
  pssst: 0.57,
  prassel: 1.49,
  klonk: 0.85,
  duns: 0.62,
  jubel: 0.91,
  // Flippet hörs ofta (två gånger per drag) och ligger därför som skottet, ett par dB under de andra.
  flipp: 1.3,
  par: 0.92,
  miss: 0.81,
  // Kassans pling hörs vid varje betjänad kund och ligger därför, som flippet, ett par dB under de andra.
  pling: 0.43,
  mynt: 1.56,
  // Snippet hörs vid varje klipp och ligger som flippet; kraschen ligger med flit ett par dB över de andra.
  snip: 2.09,
  krasch: 0.46,
  hammare: 0.75,
  tick: 0.92,
  plopp: 0.81,
  // Dinget hörs ofta (var 1 000:e portion) och ligger ett par dB under de andra.
  ding: 0.65,
  avslojande: 0.26,
  // Musiken ligger runt −36, under effekterna.
  musik: 1,
};

let kontext: AudioContext | null = null;
let utgang: AudioNode | null = null;

function hamtaKontext(): AudioContext | null {
  if (kontext) return kontext;
  const Klass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Klass) return null;
  kontext = new Klass();
  utgang = byggUtgang(kontext);
  return kontext;
}

/** Huvudvolym + mjuk begränsare, sist i kedjan före högtalaren. */
function byggUtgang(ctx: BaseAudioContext): AudioNode {
  const huvud = ctx.createGain();
  huvud.gain.value = HUVUDVOLYM;
  const begransare = ctx.createDynamicsCompressor();
  begransare.threshold.value = -6;
  begransare.knee.value = 6;
  begransare.ratio.value = 8;
  begransare.attack.value = 0.003;
  begransare.release.value = 0.15;
  huvud.connect(begransare).connect(ctx.destination);
  return huvud;
}

/**
 * Låser upp ljudet på iOS: måste ske inne i ett tryck. Startar ljudkontexten och spelar en tyst buffert.
 * Anropas vid varje tryck tills ljudet är igång (billigt efter första gången).
 */
export function laasUppLjud(): void {
  const ctx = hamtaKontext();
  if (!ctx || ctx.state === 'running') return;
  void ctx.resume();
  const tyst = ctx.createBufferSource();
  tyst.buffer = ctx.createBuffer(1, 1, 22050);
  tyst.connect(ctx.destination);
  tyst.start(0);
}

/** Pausar ljudet när appen går i bakgrunden (sparar batteri, och musiken tystnar). Återupptas vid nästa tryck. */
export function pausaLjud(pausad: boolean): void {
  if (!kontext) return;
  if (pausad) void kontext.suspend();
  else void kontext.resume();
}

/** Spelar en effekt, om ljudet är på. Tyst om webbläsaren saknar Web Audio. */
export function spela(ljud: Ljud): void {
  if (!framsteg.ljudPa()) return;
  if (ljud === 'traff' || ljud === 'misstag') vibrera();
  const ctx = hamtaKontext();
  if (!ctx || !utgang) return;
  if (ctx.state === 'suspended') void ctx.resume();
  renderaLjud(ctx, ljud, utgang, ctx.currentTime);
}

/** Ritar upp ett ljud mot en utgång från tiden nu. Exporterad så att nivåerna kan mätas (OfflineAudioContext). */
export function renderaLjud(ctx: BaseAudioContext, ljud: Ljud, mal: AudioNode, nu: number): void {
  const niva = UTJAMNING[ljud];
  if (ljud === 'pssst') {
    spelaBrus(ctx, mal, nu, niva);
    return;
  }
  if (ljud === 'prassel') {
    spelaPrassel(ctx, mal, nu, niva);
    return;
  }
  if (ljud === 'krasch') {
    spelaKrasch(ctx, mal, nu, niva);
    return;
  }
  for (const ton of LJUD[ljud]) {
    const osc = ctx.createOscillator();
    const forstarkning = ctx.createGain();
    const t0 = nu + ton.start;
    osc.type = ton.form;
    osc.frequency.setValueAtTime(ton.fran, t0);
    osc.frequency.exponentialRampToValueAtTime(ton.till, t0 + ton.langd);
    forstarkning.gain.setValueAtTime(0.0001, t0);
    forstarkning.gain.exponentialRampToValueAtTime(ton.volym * niva, t0 + 0.01);
    forstarkning.gain.exponentialRampToValueAtTime(0.0001, t0 + ton.langd);
    osc.connect(forstarkning).connect(mal);
    osc.start(t0);
    osc.stop(t0 + ton.langd + 0.02);
  }
}

/** Ett kort fräsande "pssst": vitt brus genom ett högpassfilter som tonar ut (kolsyra fylls på). */
function spelaBrus(ctx: BaseAudioContext, mal: AudioNode, t0: number, niva: number): void {
  const langd = 0.35;
  const buffert = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * langd), ctx.sampleRate);
  const data = buffert.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const kalla = ctx.createBufferSource();
  kalla.buffer = buffert;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(2500, t0);
  filter.frequency.exponentialRampToValueAtTime(5000, t0 + langd);
  const forstarkning = ctx.createGain();
  forstarkning.gain.setValueAtTime(0.0001, t0);
  forstarkning.gain.exponentialRampToValueAtTime(0.12 * niva, t0 + 0.02);
  forstarkning.gain.exponentialRampToValueAtTime(0.0001, t0 + langd);
  kalla.connect(filter).connect(forstarkning).connect(mal);
  kalla.start(t0);
  kalla.stop(t0 + langd);
}

/** Krasch: ett kort brusutbrott som mörknar (grenar som knäcks) och en dov smäll under. */
function spelaKrasch(ctx: BaseAudioContext, mal: AudioNode, t0: number, niva: number): void {
  const langd = 0.4;
  const buffert = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * langd), ctx.sampleRate);
  const data = buffert.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.4);
  const kalla = ctx.createBufferSource();
  kalla.buffer = buffert;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(5000, t0);
  filter.frequency.exponentialRampToValueAtTime(400, t0 + langd);
  const forstarkning = ctx.createGain();
  forstarkning.gain.setValueAtTime(0.0001, t0);
  forstarkning.gain.exponentialRampToValueAtTime(0.3 * niva, t0 + 0.01);
  forstarkning.gain.exponentialRampToValueAtTime(0.0001, t0 + langd);
  kalla.connect(filter).connect(forstarkning).connect(mal);
  kalla.start(t0);
  kalla.stop(t0 + langd);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, t0);
  osc.frequency.exponentialRampToValueAtTime(50, t0 + 0.25);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.35 * niva, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
  osc.connect(g).connect(mal);
  osc.start(t0);
  osc.stop(t0 + 0.32);
}

/** Pappersprassel: brus i korta, ojämna knaster genom ett bandpassfilter. */
function spelaPrassel(ctx: BaseAudioContext, mal: AudioNode, t0: number, niva: number): void {
  const langd = 0.28;
  const buffert = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * langd), ctx.sampleRate);
  const data = buffert.getChannelData(0);
  let knaster = 0;
  for (let i = 0; i < data.length; i++) {
    // Nytt knaster då och då; varje knaster klingar av snabbt.
    if (Math.random() < 0.004) knaster = 0.6 + Math.random() * 0.4;
    knaster *= 0.9985;
    data[i] = (Math.random() * 2 - 1) * (0.15 + knaster);
  }
  const kalla = ctx.createBufferSource();
  kalla.buffer = buffert;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3200, t0);
  filter.Q.setValueAtTime(0.8, t0);
  const forstarkning = ctx.createGain();
  forstarkning.gain.setValueAtTime(0.0001, t0);
  forstarkning.gain.exponentialRampToValueAtTime(0.16 * niva, t0 + 0.01);
  forstarkning.gain.exponentialRampToValueAtTime(0.0001, t0 + langd);
  kalla.connect(filter).connect(forstarkning).connect(mal);
  kalla.start(t0);
  kalla.stop(t0 + langd);
}

// ---------- Musik ----------

/** Musikslingor: basnoter (Hz) i tur och ordning, tid per not och klangfärg. "boss-ljus" är fas 2. */
export const SLINGOR = {
  boss: { noter: [55, 55, 65.4, 49], takt: 0.42, form: 'sawtooth' as OscillatorType, volym: 0.074 },
  'boss-ljus': { noter: [110, 130.8, 146.8, 130.8], takt: 0.32, form: 'triangle' as OscillatorType, volym: 0.068 },
};
export type Slinga = keyof typeof SLINGOR;

let slinga: { namn: Slinga; timer: number; nasta: number; index: number } | null = null;

/** Startar (eller byter till) en musikslinga. Tyst när ljudet är av; spelar vidare när det slås på igen. */
export function startaMusik(namn: Slinga): void {
  stoppaMusik();
  const ctx = hamtaKontext();
  if (!ctx) return;
  slinga = { namn, timer: 0, nasta: ctx.currentTime + 0.05, index: 0 };
  // Planerar noterna en bit framåt, så att takten håller även om sidan hackar.
  slinga.timer = window.setInterval(() => {
    if (!slinga) return;
    const s = SLINGOR[slinga.namn];
    while (slinga.nasta < ctx.currentTime + 0.3) {
      if (framsteg.ljudPa() && ctx.state === 'running' && utgang) spelaNot(ctx, utgang, s.noter[slinga.index % s.noter.length], slinga.nasta, s.takt, s.form, s.volym);
      slinga.nasta += s.takt;
      slinga.index += 1;
    }
  }, 100);
}

export function stoppaMusik(): void {
  if (slinga) window.clearInterval(slinga.timer);
  slinga = null;
}

/** En not i musikslingan. Exporterad för mätning, som renderaLjud. */
export function spelaNot(ctx: BaseAudioContext, mal: AudioNode, frekvens: number, t0: number, langd: number, form: OscillatorType, volym: number): void {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = form;
  osc.frequency.setValueAtTime(frekvens, t0);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(form === 'triangle' ? 1800 : 420, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(volym * UTJAMNING.musik, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + langd * 0.9);
  osc.connect(filter).connect(g).connect(mal);
  osc.start(t0);
  osc.stop(t0 + langd);
}

export const ljud = {
  arPa: () => framsteg.ljudPa(),
  sattPa: (pa: boolean) => framsteg.sattLjud(pa),
};

/** Ljudkontextens tillstånd ("running", "suspended" …), för felsökning och test. */
export function ljudTillstand(): string {
  return kontext?.state ?? 'ingen';
}
