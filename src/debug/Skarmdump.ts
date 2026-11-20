/**
 * Skärmdumpsläget (?screenshot=1, bara i utvecklings-/testbygget, se flaggor.ts).
 * - Inga testknappar.
 * - Påhittade framsteg som bara finns i minnet: alla tio nivåer i kapitel 1 klarade, så kartan och säsongsskärmen ser
 *   färdigspelade ut och nivåernas förklaringar i steg hoppas över. De riktiga sparade framstegen rörs inte.
 * - Med &niva=1, 2, 5, 8 eller 10 startar nivån direkt, spelas en kort stund av sig själv och fryses i ett
 *   snyggt läge (efter några sekunder). Inget extra syns på skärmen; i konsolen står "SKÄRMDUMPSLÄGE: fryst"
 *   när bilden är klar att ta.
 * Strängen "SKÄRMDUMPSLÄGE" används också av scripts/kolla-bygge.mjs för att se att läget inte finns i appbygget.
 */
import Phaser from 'phaser';

/** Nivånummer -> nivå-id för de nivåer som har ett skärmdumpsläge. */
const NIVAER: Record<string, string> = {
  '1': 'golfbollen',
  '2': 'lopsedeln',
  '5': 'de-forsvunna-korna',
  '8': 'flytdockan',
  '10': 'fastighetsforum',
};

/** Framstegen i skärmdumpsläget: alla nivåer i kapitel 1 klarade, de flesta med tre stjärnor. */
export function skarmdumpFramsteg(): {
  version: number;
  ljud: boolean;
  kapitel: Record<string, { stjarnor: Record<string, number>; guld: Record<string, true>; klartSett: boolean }>;
} {
  return {
    version: 3,
    ljud: false,
    kapitel: {
      'kapitel-1': {
        stjarnor: {
          golfbollen: 3,
          lopsedeln: 3,
          travstallet: 2,
          'begagnade-bilen': 3,
          'de-forsvunna-korna': 3,
          kolsyretuberna: 2,
          elrakningen: 3,
          flytdockan: 3,
          dubbelstraffet: 3,
          fastighetsforum: 3,
        },
        guld: { golfbollen: true, elrakningen: true },
        klartSett: true,
      },
    },
  };
}

/** Nivå-id att starta direkt (från &niva=…), eller undefined för startskärmen. */
export function skarmdumpStart(): string | undefined {
  const nr = new URLSearchParams(window.location.search).get('niva') ?? '';
  return NIVAER[nr];
}

// ---------- Regi: nivån spelas en kort stund av sig själv och fryses ----------

/* eslint-disable @typescript-eslint/no-explicit-any -- regin styr mekanikernas interna delar, bara i skärmdumpsläget */
type Fritt = any;

/** Fryser scenen: allt står still (fysik, klockor, animationer) men ritas fortfarande. */
function frys(scene: Phaser.Scene): void {
  scene.scene.pause();
  console.info('SKÄRMDUMPSLÄGE: fryst – ta skärmdumpen nu.');
}

/** Slangbella: skjuter med ett visst drag (samma som att dra bakåt och släppa). */
function skjut(m: Fritt, dx: number, dy: number): void {
  m.kastare.skjut(new Phaser.Math.Vector2(dx, dy));
}

/** Startrutan ("Starta") i invaders-nivåerna. */
function tryckStarta(scene: Phaser.Scene, startText: string): void {
  const knapp = scene.children.list.find(
    (o) => o instanceof Phaser.GameObjects.Container && o.list.some((c) => c instanceof Phaser.GameObjects.Text && c.text === startText),
  );
  knapp?.emit('pointerup');
}

/**
 * Startar regin för nivån. Anropas från LevelScene när mekaniken är skapad (bara i skärmdumpsläget).
 * frysMs i adressen (&frys=…) ändrar när bilden fryses, för att prova fram ett bättre läge.
 */
export function skarmdumpRegi(scene: Phaser.Scene, nivaId: string, mekanik: unknown, startText: string): void {
  const m = mekanik as Fritt;
  const q = new URLSearchParams(window.location.search);
  const frysMs = (standard: number) => Number(q.get('frys') ?? standard);
  console.info(`SKÄRMDUMPSLÄGE: ${nivaId}`);

  switch (nivaId) {
    case 'golfbollen':
      // Ett slag som landar på greenen, sedan nästa slag i luften.
      slangbella(scene, m, [[-62, 52], [-58, 46]], frysMs(27));
      break;
    case 'flytdockan':
      // Första skottet träffar bossen, som svarar.
      slangbella(scene, m, [[-25, 80]], frysMs(22));
      break;
    case 'fastighetsforum':
      // Skottet studsar mellan domstolarna.
      slangbella(scene, m, [[-45, 95]], frysMs(54));
      break;
    case 'lopsedeln':
      invaders(scene, m, startText, frysMs(2600), (klocka) => skjutLopsedeln(m, klocka));
      break;
    case 'de-forsvunna-korna':
      invaders(scene, m, startText, frysMs(6000), () => forsvaraKorna(m));
      break;
  }
}

/**
 * Slangbella: skjuter skotten i tur och ordning, vart och ett när slangbellan är laddad och allt ligger still,
 * och fryser bilden ett visst antal bildrutor (fysiksteg) efter sista skottet. Bildrutor i stället för
 * millisekunder, så att bilden blir densamma även när datorn ritar långsamt.
 */
function slangbella(scene: Phaser.Scene, m: Fritt, skott: [number, number][], rutorEfterSista: number): void {
  let i = 0;
  let stilla = 0;
  let efter = -1;
  const t0 = scene.time.now;
  const f = () => {
    if (efter >= 0) {
      if (++efter >= rutorEfterSista) {
        scene.events.off(Phaser.Scenes.Events.UPDATE, f);
        frys(scene);
      }
      return;
    }
    const k = m.kastare;
    const redo = !k.flyger && k.projektil?.visible && (!m.block || m.block.iVila());
    stilla = redo ? stilla + 1 : 0;
    // Ligger still en stund, och mellanstoppet ("BOSS – …", 1,35 s) är borta.
    if (stilla < 40 || scene.time.now - t0 < 1600) return;
    stilla = 0;
    skjut(m, skott[i][0], skott[i][1]);
    i += 1;
    if (i === skott.length) efter = 0;
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, f);
}

/**
 * Invaders: trycker "Starta" (tills nivån startat), gör något i varje bildruta och fryser när nivåns egen
 * klocka (millisekunder spelad tid) nått frysMs. Nivåns klocka i stället för scenens, så att bilden blir
 * densamma även när datorn ritar långsamt.
 */
function invaders(scene: Phaser.Scene, m: Fritt, startText: string, frysMs: number, steg: (klocka: number) => void): void {
  const t0 = scene.time.now;
  const f = () => {
    if (!m.startad) {
      if (scene.time.now - t0 > 500) tryckStarta(scene, startText);
      return;
    }
    if (m.klocka >= frysMs) {
      scene.events.off(Phaser.Scenes.Events.UPDATE, f);
      frys(scene);
      return;
    }
    steg(m.klocka);
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, f);
}

/** Löpsedeln: skjuter bort felstavade bokstäver en i taget, en var 650:e millisekund. */
const LOPSEDELN_MAL: [string, string][] = [['R', 'fel'], ['A', 'fel'], ['U', 'ratt'], ['N', 'fel']];
function skjutLopsedeln(m: Fritt, klocka: number): void {
  const i = Math.floor((klocka - 300) / 650);
  if (i < 0 || i >= LOPSEDELN_MAL.length || m.skjutet?.[i]) return;
  m.skjutet = { ...m.skjutet, [i]: true };
  const [etikett, typ] = LOPSEDELN_MAL[i];
  const lev = m.rutnat.brickor.filter((b: Fritt) => b.levande).map((b: Fritt) => ({ b, v: m.rutnat.varldsMitt(b) }));
  const o = lev.find(
    (o: Fritt) => o.b.data.typ === typ && o.b.data.etikett === etikett && !lev.some((q: Fritt) => q !== o && q.v.y > o.v.y && Math.abs(q.v.x - o.v.x) < 30),
  );
  if (!o) return;
  m.spelare.x = o.v.x;
  m.sistaSkott = -1e9;
  m.skjut();
}

/** De försvunna korna: skjuter den lägsta uppsägningen, och ufot när det lyfter en ko. */
function forsvaraKorna(m: Fritt): void {
  if (m.klar || m.skott.length) return;
  const hot = m.hot?.aktiva ?? [];
  const lagst = hot.length ? hot.reduce((a: Fritt, c: Fritt) => (c.obj.y > a.obj.y ? c : a)) : null;
  const lyft = m.dekor?.lyft;
  if (lyft?.kalla && (!lagst || lagst.obj.y < 520)) {
    m.spelare.x = lyft.kalla.x;
  } else if (lagst && lagst.obj.y > 330) {
    m.spelare.x = lagst.obj.x;
  } else {
    return;
  }
  m.sistaSkott = -1e9;
  m.skjut();
}
