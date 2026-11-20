/**
 * Enkla ljudeffekter, genererade med Web Audio (inga ljudfiler, inga beroenden).
 * Ljudet kan stängas av på kartan; valet sparas via progress.ts.
 */
import { framsteg } from './progress';

export type Ljud = 'skott' | 'traff' | 'fanga' | 'misstag' | 'vinst' | 'stampel' | 'muu' | 'pssst' | 'prassel' | 'klonk';
type Tonljud = Exclude<Ljud, 'pssst' | 'prassel'>;

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
  misstag: [{ fran: 180, till: 90, start: 0, langd: 0.28, form: 'sawtooth', volym: 0.07 }],
  vinst: [
    { fran: 523, till: 523, start: 0, langd: 0.14, form: 'triangle', volym: 0.13 },
    { fran: 659, till: 659, start: 0.12, langd: 0.14, form: 'triangle', volym: 0.13 },
    { fran: 784, till: 784, start: 0.24, langd: 0.14, form: 'triangle', volym: 0.13 },
    { fran: 1047, till: 1047, start: 0.36, langd: 0.32, form: 'triangle', volym: 0.12 },
  ],
};

let kontext: AudioContext | null = null;

function hamtaKontext(): AudioContext | null {
  if (kontext) return kontext;
  const Klass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Klass) return null;
  kontext = new Klass();
  return kontext;
}

/** Spelar en effekt, om ljudet är på. Tyst om webbläsaren saknar Web Audio. */
export function spela(ljud: Ljud): void {
  if (!framsteg.ljudPa()) return;
  const ctx = hamtaKontext();
  if (!ctx) return;
  // iOS startar ljudet pausat tills användaren rört skärmen; alla anrop kommer från tryck/spel.
  if (ctx.state === 'suspended') void ctx.resume();
  const nu = ctx.currentTime;
  if (ljud === 'pssst') {
    spelaBrus(ctx, nu);
    return;
  }
  if (ljud === 'prassel') {
    spelaPrassel(ctx, nu);
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
    forstarkning.gain.exponentialRampToValueAtTime(ton.volym, t0 + 0.01);
    forstarkning.gain.exponentialRampToValueAtTime(0.0001, t0 + ton.langd);
    osc.connect(forstarkning).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + ton.langd + 0.02);
  }
}

/** Ett kort fräsande "pssst": vitt brus genom ett högpassfilter som tonar ut (kolsyra fylls på). */
function spelaBrus(ctx: AudioContext, t0: number): void {
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
  forstarkning.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
  forstarkning.gain.exponentialRampToValueAtTime(0.0001, t0 + langd);
  kalla.connect(filter).connect(forstarkning).connect(ctx.destination);
  kalla.start(t0);
  kalla.stop(t0 + langd);
}

/** Pappersprassel: brus i korta, ojämna knaster genom ett bandpassfilter. */
function spelaPrassel(ctx: AudioContext, t0: number): void {
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
  forstarkning.gain.exponentialRampToValueAtTime(0.16, t0 + 0.01);
  forstarkning.gain.exponentialRampToValueAtTime(0.0001, t0 + langd);
  kalla.connect(filter).connect(forstarkning).connect(ctx.destination);
  kalla.start(t0);
  kalla.stop(t0 + langd);
}

// ---------- Musik ----------

/** Musikslingor: basnoter (Hz) i tur och ordning, tid per not och klangfärg. "boss-ljus" är fas 2. */
const SLINGOR = {
  boss: { noter: [55, 55, 65.4, 49], takt: 0.42, form: 'sawtooth' as OscillatorType, volym: 0.07 },
  'boss-ljus': { noter: [110, 130.8, 146.8, 130.8], takt: 0.32, form: 'triangle' as OscillatorType, volym: 0.08 },
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
      if (framsteg.ljudPa() && ctx.state === 'running') spelaNot(ctx, s.noter[slinga.index % s.noter.length], slinga.nasta, s.takt, s.form, s.volym);
      slinga.nasta += s.takt;
      slinga.index += 1;
    }
  }, 100);
}

export function stoppaMusik(): void {
  if (slinga) window.clearInterval(slinga.timer);
  slinga = null;
}

function spelaNot(ctx: AudioContext, frekvens: number, t0: number, langd: number, form: OscillatorType, volym: number): void {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = form;
  osc.frequency.setValueAtTime(frekvens, t0);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(form === 'triangle' ? 1800 : 420, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(volym, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + langd * 0.9);
  osc.connect(filter).connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + langd);
}

export const ljud = {
  arPa: () => framsteg.ljudPa(),
  sattPa: (pa: boolean) => framsteg.sattLjud(pa),
};
