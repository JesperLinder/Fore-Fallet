/**
 * Enkla ljudeffekter, genererade med Web Audio (inga ljudfiler, inga beroenden).
 * Ljudet kan stängas av på kartan; valet sparas via progress.ts.
 */
import { framsteg } from './progress';

export type Ljud = 'skott' | 'traff' | 'fanga' | 'misstag' | 'vinst';

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

const LJUD: Record<Ljud, Ton[]> = {
  skott: [{ fran: 880, till: 440, start: 0, langd: 0.07, form: 'square', volym: 0.05 }],
  traff: [{ fran: 520, till: 180, start: 0, langd: 0.12, form: 'triangle', volym: 0.14 }],
  fanga: [
    { fran: 660, till: 660, start: 0, langd: 0.08, form: 'sine', volym: 0.14 },
    { fran: 990, till: 990, start: 0.07, langd: 0.12, form: 'sine', volym: 0.12 },
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

export const ljud = {
  arPa: () => framsteg.ljudPa(),
  sattPa: (pa: boolean) => framsteg.sattLjud(pa),
};
