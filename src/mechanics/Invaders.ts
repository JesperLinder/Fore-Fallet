/**
 * Invaders-mekaniken. Spelaren flyttas i sidled längst ner och skjuter uppåt mot ett rutnät av brickor
 * som rör sig stegvis nedåt. Varje bricktyp i nivåfilen (brickor.typer) anger själv vad som händer vid
 * träff (onHit) och när brickan når spelaren (onPass) – t.ex. ska bort, får inte träffas, ska fyllas.
 * Valfritt: fler vågor, fallande fångstobjekt, skydd, hot, dekor, nedräkning. Allt kommer från nivåfilen.
 * Sköldläge (skold): spelaren skjuter inte utan styr en sköld som blockerar skyttarnas märkta projektiler
 * (invaders/shooters.ts); regelmotorn (invaders/rules.ts) bedömer varje blockering och träff.
 *
 * Styrning: dra var som helst för att flytta (relativt, så fingret inte skymmer), släpp för att skjuta.
 * Med skott.lage "auto" skjuter spelaren i stället hela tiden medan fingret är nere.
 */
import Phaser from 'phaser';
import { hornkort } from '../ui/HeaderCard';
import { avstand, farg, radie } from '../config/theme';
import { BREDD, HOJD, MITT_X } from '../config/display';
import type { BottenRegel, BrickInstallningar, FangstRegel, ForlustOrsak, InvadersInstallningar, Niva, SkyddData } from '../core/levelTypes';
import type { FargNamn } from '../config/theme';
import { pratbubbla } from '../ui/Badge';
import { spela, type Ljud } from '../core/sound';
import type { Mekanik, MekanikKontext } from './Mechanic';
import { ritaFigur } from './art';
import { Rutnat, type Bricka } from './invaders/grid';
import { aterstall, fallSteg, skapaFangst, type Fangst } from './invaders/falling';
import { byggHud, INFO_Y, type InvadersHud } from './invaders/hud';
import { FallandeHot } from './invaders/threats';
import { Dekorhandelser } from './invaders/decor';
import { skapaText } from '../ui/text';
import { text } from '../config/strings';
import { streckadLinje } from '../ui/shapes';
import { visaStart } from './common/startPanel';
import { spelTips } from '../ui/TipPanel';
import { Skyttar, type MarktProjektil } from './invaders/shooters';
import { Projektilregler } from './invaders/rules';
import { visaIntro } from './common/intro';
import { framsteg } from '../core/progress';
import { Fangststrom } from './invaders/stream';
import { Engangshandelser, RullandeVag, ritaKulisse, ritaKulisser, visaTalbubbla } from './invaders/scenery';
import { VaxandeMalen } from './invaders/growth';
import { Faktura } from './invaders/invoice';
import { Knapp } from '../ui/Button';

const SKOTT_B = 5;
const SKOTT_H = 14;
/** Minsta tid mellan två färgblinkar – håller blinkandet under tre gånger per sekund. */
const MIN_BLINK_MS = 400;

type Matare = NonNullable<InvadersInstallningar['matare']>;
/** Utan mätare: en osynlig mätare som aldrig blir full. */
const INGEN_MATARE: Matare = { namn: '', steg: Number.MAX_SAFE_INTEGER, visning: 'ingen' };

/** Nivåer som bara har fångstobjekt (strom) saknar brickor: då används ett tomt rutnät. */
const INGA_BRICKOR: BrickInstallningar = {
  typer: {},
  rader: [],
  b: 1,
  h: 1,
  mellanrum: 0,
  startY: 0,
  steg: { x: 0, ned: 0, intervall: 1e9 },
  kant: { vanster: 0, hoger: BREDD },
};

interface Skydd {
  data: SkyddData;
  obj: Phaser.GameObjects.Container;
  kvar: number;
}

export class Invaders implements Mekanik {
  private scene: Phaser.Scene;
  private niva: Niva;
  private inst: InvadersInstallningar & { brickor: BrickInstallningar; matare: Matare };
  private hud: InvadersHud;
  private rutnat: Rutnat;
  private fangst: Fangst[];
  private skydd: Skydd[];
  /** Spelaren: figuren (och ev. etikett) i en behållare som flyttas i sidled. */
  private spelare: Phaser.GameObjects.Container;
  private sikte: Phaser.GameObjects.Graphics;
  private blink: Phaser.GameObjects.Rectangle;
  private skott: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Graphics)[] = [];
  private hot?: FallandeHot;
  private dekor?: Dekorhandelser;
  private instruktion?: Phaser.GameObjects.Text;
  private skyttar?: Skyttar;
  private regler?: Projektilregler;
  /** Det som skyddas i sköldläget (figuren byts mot "ledsen" en stund vid fel). */
  private skyddas?: Phaser.GameObjects.Graphics;
  private strom?: Fangststrom;
  private handelser?: Engangshandelser;
  private vag?: RullandeVag;
  /** Mätare med lage "fyll": hur många steg den fyllts. */
  private fyllSteg = 0;
  private vaxande?: VaxandeMalen;
  /** Etapperna (delar som visas en i taget) och regler vars text eller talbubbla redan visats en gång. */
  private etapper: Phaser.GameObjects.Container[] = [];
  private visadEnGang = new Set<object>();
  /** Den scriptade avslutningen (handelser med start "vinst") pågår: spelet står still. */
  private slutscen = false;
  private faktura?: Faktura;
  /** Fakturans studstext visas bara första gången. */
  private fakturaStudsVisad = false;

  private startad = false;
  private pausad = false;
  private klar = false;
  private tidKvar: number;
  private matarSteg = 0;
  private misstag = 0;
  private poang = 0;
  private fangade = 0;
  private sistaSkott = -Infinity;
  private sistaBlink = -Infinity;
  private klocka = 0;
  /** Namngivna räknare ("raknas" i onHit/onPass), för stjarnkrav.maxAntal. */
  private antal: Record<string, number> = {};
  /** Index i brickor.vagor för nästa våg; vagByte = en ny våg är på väg in. */
  private nastaVag = 0;
  private vagByte = false;

  private fingerNere = false;
  private dragStartX = 0;
  private spelareStartX = 0;

  constructor(private kontext: MekanikKontext) {
    this.scene = kontext.scene;
    this.niva = kontext.niva;
    if (!this.niva.invaders) throw new Error(`Nivån "${this.niva.id}" saknar "invaders"-inställningar`);
    this.inst = { ...this.niva.invaders, brickor: this.niva.invaders.brickor ?? INGA_BRICKOR, matare: this.niva.invaders.matare ?? INGEN_MATARE };
    this.tidKvar = this.inst.tid?.sekunder ?? Infinity;

    this.hud = byggHud(this.scene, this.inst, this.niva.tema ?? 'ljus');
    this.rutnat = new Rutnat(this.scene, this.inst.brickor);
    const fiendePositioner = () => this.rutnat.brickor.filter((b) => b.levande).map((b) => this.rutnat.varldsMitt(b));
    if (this.inst.dekor) this.dekor = new Dekorhandelser(this.scene, this.inst.dekor, fiendePositioner, this.hud.visaRaknare);
    if (this.inst.hot) this.hot = new FallandeHot(this.scene, this.inst.hot, fiendePositioner);
    this.skydd = (this.inst.skydd ?? []).map((d) => this.skapaSkydd(d));
    this.fangst = (this.inst.fangst ?? []).map((d) => skapaFangst(this.scene, d));
    if (this.inst.bakgrund) this.vag = new RullandeVag(this.scene, this.inst.bakgrund);
    const kulisser = this.inst.kulisser ? ritaKulisser(this.scene, this.inst.kulisser) : [];
    if (this.inst.strom) this.strom = new Fangststrom(this.scene, this.inst.strom);
    if (this.inst.handelser) this.handelser = new Engangshandelser(this.scene, this.inst.handelser);
    // Kulisser med id kan bytas av en engångshändelse (t.ex. läraren i matsalen).
    this.inst.kulisser?.forEach((k, i) => {
      const g = kulisser[i].list[0];
      if (k.id && g instanceof Phaser.GameObjects.Graphics) this.handelser?.registrera(k.id, g, k.b, k.h);
    });
    if (this.inst.etapper) this.etapper = this.inst.etapper.delar.map((d) => ritaKulisse(this.scene, d).setAlpha(0));
    if (this.inst.vaxande) this.vaxande = new VaxandeMalen(this.scene, this.inst.vaxande);
    if (this.inst.faktura) {
      // Golvet: alla avdrag som finns i fasen (hotens sorter × antal), per fakturarad.
      const avdrag: number[] = [];
      for (const [namn, typ] of Object.entries(this.inst.hot?.typer ?? {})) {
        const a = typ.vidTraff?.avdrag;
        if (a) avdrag[a.rad] = (avdrag[a.rad] ?? 0) + a.belopp * (this.inst.hot?.antal?.[namn] ?? 1);
      }
      this.faktura = new Faktura(this.scene, this.inst.faktura, this.kontext.arv ?? {}, avdrag);
    }
    this.ritaInstruktion();

    this.sikte = this.scene.add.graphics().setDepth(8);
    const sp = this.inst.spelare;
    const figur = this.scene.add.graphics();
    ritaFigur(figur, sp.utseende, 0, 0, sp.b, sp.h);
    this.spelare = this.scene.add.container(MITT_X, sp.y, [figur]).setDepth(20);
    if (this.inst.skold?.etikett) {
      // Sköldläge: texten står under skölden.
      this.spelare.add(skapaText(this.scene, 0, sp.h / 2 + 12, this.inst.skold.etikett, 'overrubrik', 'morkockra', { origo: [0.5, 0.5], storlek: 10 }));
    } else if (sp.etikett) {
      const t = skapaText(this.scene, 0, 0, sp.etikett, 'etikett', 'morkgron', { origo: [0.5, 0.5], storlek: 10, justering: 'center' });
      // Krymp texten så att den ryms i figuren.
      if (t.width > sp.b * 0.82) t.setScale((sp.b * 0.82) / t.width);
      this.spelare.add(t);
    }
    this.blink = this.scene.add.rectangle(MITT_X, HOJD / 2, BREDD, HOJD, farg.vinrod, 1).setDepth(60).setAlpha(0);

    this.byggSkoldlage();

    this.hud.visaTid(this.tidKvar);
    this.hud.visaMatare(0);
    this.visaSumma();
    // Förklaringen i steg visas bara tills nivån klarats en gång.
    const intro = this.inst.introSteg?.length && !framsteg.arKlar(this.niva.id) ? this.inst.introSteg : undefined;
    const start = () => visaStart(this.scene, this.kontext.tips, () => {
      this.startad = true;
      if (this.inst.tipsUnderSpel) {
        const t = spelTips(this.scene, this.niva.fylgiaTips, this.niva.tema ?? 'ljus').setAlpha(0);
        this.scene.tweens.add({ targets: t, alpha: 1, duration: 300 });
      }
    });
    if (this.niva.utanStart) {
      // Ingen startruta (t.ex. fas 2): spelet börjar när mellanstoppet tonats bort.
      this.kontext.tips.setVisible(false);
      this.scene.time.delayedCall(this.niva.mellanstopp ? 1350 : 0, () => {
        this.startad = true;
        if (this.inst.tipsUnderSpel) spelTips(this.scene, this.niva.fylgiaTips, this.niva.tema ?? 'ljus');
      });
    } else if (intro) {
      this.kontext.tips.setVisible(false);
      visaIntro(this.scene, intro, () => {
        this.kontext.tips.setVisible(true);
        start();
      });
    } else {
      start();
    }

    this.scene.input.on('pointerdown', this.ner, this);
    this.scene.input.on('pointermove', this.flytta, this);
    this.scene.input.on('pointerup', this.upp, this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }

  // ---------- Sköldläge ----------

  /** Det som skyddas, hörnrutan och skyttarna med sina regler (om nivån har dem). */
  private byggSkoldlage(): void {
    const s = this.inst.skyddas;
    if (s) {
      this.skyddas = this.scene.add.graphics({ x: s.x, y: s.y }).setDepth(9);
      ritaFigur(this.skyddas, s.utseende, 0, 0, s.b, s.h);
      if (s.etikett) skapaText(this.scene, s.x, s.y + s.h / 2 + 12, s.etikett, 'knapp', 'morkgron', { origo: [0.5, 0.5], storlek: 12 }).setDepth(9);
    }
    if (this.inst.hornruta) this.ritaHornruta(this.inst.hornruta);
    const sk = this.inst.skyttar;
    if (!sk) return;
    this.regler = new Projektilregler(sk);
    const sp = this.inst.spelare;
    this.skyttar = new Skyttar(this.scene, sk, () => ({ x: this.spelare.x, y: sp.y, b: sp.b, h: sp.h }), (p, blockerad, x, y) =>
      this.bedomProjektil(p, blockerad, x, y),
    );
  }

  /** Liten tvåradig ruta i hörnet (kompakt, så att den inte krockar med titeln). */
  private ritaHornruta(h: { rubrik: string; text: string }): void {
    hornkort(this.scene, h.rubrik, 'ljusbeige', true).satt(h.text);
  }

  /** En märkt projektil har blockerats eller träffat: bedöm mot reglerna och ge utfallet. */
  private bedomProjektil(p: MarktProjektil, blockerad: boolean, x: number, y: number): void {
    if (this.klar || !this.regler) return;
    const b = this.regler.bedom(p.typ, p.markning, blockerad);
    if (b.forstaTraff) this.skyttar?.markera(p.markning);
    if (!b.fel) return;
    const u = b.utfall;
    this.registreraMisstag(u?.matare ?? 0, u?.text, x, y);
    const s = this.inst.skyddas;
    if (u?.ledsen && s?.ledsen && this.skyddas) {
      const g = this.skyddas;
      g.clear();
      ritaFigur(g, s.ledsen, 0, 0, s.b, s.h);
      this.scene.time.delayedCall(u.ledsen, () => {
        g.clear();
        ritaFigur(g, s.utseende, 0, 0, s.b, s.h);
      });
    }
  }

  // ---------- Start ----------

  private ritaInstruktion(): void {
    const ins = this.inst.instruktion;
    if (!ins) return;
    const t = skapaText(this.scene, MITT_X, ins.y, ins.text, 'brod', 'ljusbeige', { origo: [0.5, 0.5], storlek: 14 }).setDepth(9);
    this.instruktion = t;
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 6000, duration: 800 });
  }

  private skapaSkydd(d: SkyddData): Skydd {
    const g = this.scene.add.graphics();
    g.lineStyle(1.5, farg.lila, 1).strokeRoundedRect(-d.b / 2, -d.h / 2, d.b, d.h, radie.s - 2);
    const t = skapaText(this.scene, 0, 0, d.etikett, 'etikett', 'lila', { origo: [0.5, 0.5], storlek: 11 });
    const obj = this.scene.add.container(d.x, d.y, [g, t]).setDepth(9);
    return { data: d, obj, kvar: d.talighet };
  }

  // ---------- Styrning ----------

  private aktiv(): boolean {
    return this.startad && !this.pausad && !this.klar;
  }

  private varldsX(p: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    return this.scene.cameras.main.getWorldPoint(p.x, p.y);
  }

  private ner(p: Phaser.Input.Pointer): void {
    if (!this.aktiv()) return;
    const v = this.varldsX(p);
    if (v.y < INFO_Y) return; // sidhuvudet (pausknappen)
    this.fingerNere = true;
    this.dragStartX = v.x;
    this.spelareStartX = this.spelare.x;
  }

  private flytta(p: Phaser.Input.Pointer): void {
    if (!this.fingerNere || !this.aktiv()) return;
    const halv = this.inst.spelare.b / 2 + 4;
    const x = this.spelareStartX + (this.varldsX(p).x - this.dragStartX);
    this.spelare.x = Phaser.Math.Clamp(x, avstand.l + halv, BREDD - avstand.l - halv);
  }

  private upp(): void {
    if (!this.fingerNere) return;
    this.fingerNere = false;
    if (this.aktiv() && this.inst.skott?.lage === 'slapp') this.skjut();
    if (this.aktiv() && this.vaxande) this.klipp();
  }

  private skjut(): void {
    if (!this.inst.skott || this.klocka - this.sistaSkott < this.inst.skott.intervall) return;
    this.sistaSkott = this.klocka;
    const y = this.spelare.y - this.inst.spelare.h / 2 - SKOTT_H / 2;
    const figur = this.inst.skott.utseende;
    if (figur) {
      const g = this.scene.add.graphics({ x: this.spelare.x, y }).setDepth(15);
      ritaFigur(g, figur, 0, 0);
      this.skott.push(g);
    } else {
      this.skott.push(this.scene.add.rectangle(this.spelare.x, y, SKOTT_B, SKOTT_H, farg.guld).setDepth(15));
    }
    spela('skott');
  }

  // ---------- Spelloopen ----------

  private uppdatera(_tid: number, dt: number): void {
    // Den scriptade avslutningen: allt annat står still medan händelsen spelas.
    if (this.slutscen) {
      if (!this.pausad) this.handelser?.uppdatera(Math.min(dt, 50));
      return;
    }
    if (!this.aktiv()) return;
    dt = Math.min(dt, 50); // hoppa inte långt efter en hackning
    this.klocka += dt;

    if (this.inst.tid) {
      this.tidKvar -= dt / 1000;
      this.hud.visaTid(this.tidKvar);
    }
    if (this.fingerNere && this.inst.skott?.lage === 'auto') this.skjut();

    this.rutnat.uppdatera(dt);
    this.slappIgenom();
    this.kollaVag();
    this.dekor?.uppdatera(dt);
    this.flyttaHot(dt);
    this.skyttar?.uppdatera(dt, this.inst.tid ? 1 - this.tidKvar / this.inst.tid.sekunder : 0);
    this.flyttaSkott(dt);
    this.flyttaFangst(dt);
    this.flyttaStrom(dt);
    this.vaxa(dt);
    this.vag?.uppdatera(dt);
    this.handelser?.uppdatera(dt);
    this.ritaSikte();
    this.kollaSlut();
  }

  private flyttaSkott(dt: number): void {
    const dy = ((this.inst.skott?.fart ?? 0) * dt) / 1000;
    this.skott = this.skott.filter((s) => {
      s.y -= dy;
      const traff = this.skottTraffar(s.x, s.y - SKOTT_H / 2);
      if (traff || s.y < this.hud.tak) {
        s.destroy();
        return false;
      }
      return true;
    });
  }

  /** Hanterar träff mot skydd eller bricka. Returnerar true om skottet ska försvinna. */
  private skottTraffar(x: number, y: number): boolean {
    const hotTraff = this.hot?.traff(x, y);
    if (hotTraff) {
      const vt = hotTraff.typ?.vidTraff;
      if (!hotTraff.typ) spela('traff');
      else {
        if (vt?.studsa) this.studsa(x, y);
        else if (!vt?.ljud) spela('traff');
        this.tillampa(vt, false, hotTraff.x, hotTraff.y - 40);
        if (vt?.avdrag) this.faktura?.dra(vt.avdrag.rad, vt.avdrag.belopp);
      }
      return true;
    }
    if (this.faktura?.traff(x, y)) {
      // Fakturan går inte att skjuta bort: skottet studsar (texten bara första gången).
      this.studsa(x, y);
      this.faktura.skaka();
      if (!this.fakturaStudsVisad && this.inst.faktura?.studsText) {
        this.fakturaStudsVisad = true;
        this.popup(MITT_X, this.faktura.nedersta() + 28, this.inst.faktura.studsText, 'ljusbeige', 'morkgron');
      }
      return true;
    }
    const raddad = this.dekor?.traff(x, y);
    if (raddad) {
      spela('fanga');
      const t = this.inst.dekor?.handelse.raddning?.text;
      if (t) this.popup(raddad.x, raddad.y - 40, t, 'guld', 'morkgron');
      return true;
    }
    const skydd = this.skydd.find(
      (s) => s.kvar > 0 && Math.abs(x - s.data.x) <= s.data.b / 2 && Math.abs(y - s.data.y) <= s.data.h / 2,
    );
    if (skydd) {
      skydd.kvar -= 1;
      skydd.obj.setAlpha(0.25 + (0.75 * skydd.kvar) / skydd.data.talighet);
      if (skydd.kvar <= 0) skydd.obj.destroy();
      return true;
    }
    if (this.inst.brickor.skottGenom) return false; // skotten passerar brickorna (t.ex. ufon)
    const bricka = this.rutnat.traff(x, y);
    if (!bricka) return false;
    this.traffaBricka(bricka);
    return true;
  }

  /** En träffad bricka: reveal om den är dold, annars enligt typens onHit. */
  private traffaBricka(bricka: Bricka): void {
    if (bricka.data.dold) {
      // Reveal: första träffen avslöjar brickan, den ligger kvar.
      this.rutnat.avsloja(bricka);
      spela('stampel');
      return;
    }
    const regel = this.rutnat.typ(bricka).onHit;
    if (!regel) return;
    const mitt = this.rutnat.varldsMitt(bricka);
    if (regel.effekt === 'ta-bort') {
      this.rutnat.taBort(bricka);
      if (regel.ersattTyp) this.rutnat.ersatt(bricka, regel.ersattTyp);
      spela(regel.ljud ?? 'traff');
    } else if (regel.effekt === 'fyll') {
      this.rutnat.fyll(bricka);
      spela(regel.ljud ?? 'pssst');
    } else {
      this.skakaBricka(bricka);
    }
    this.poang += regel.poang ?? 0;
    this.rakna(regel.raknas);
    const textY = mitt.y + this.inst.brickor.h / 2 + 22;
    if (regel.misstag || regel.matare) this.registreraMisstag(regel.matare ?? 0, regel.text, mitt.x, textY);
    else if (regel.text && (regel.poang ?? 0) < 0) this.popup(mitt.x, textY, regel.text, 'morkgron', 'ljusbeige');
    else if (regel.text) this.popup(mitt.x, textY, regel.text, 'guld', 'morkgron');
  }

  /** Ett skott som studsar tillbaka: en kort guldstav som faller och tonas bort. */
  private studsa(x: number, y: number): void {
    spela('duns');
    const s = this.scene.add.rectangle(x, y, SKOTT_B, SKOTT_H, farg.guld).setDepth(15);
    this.scene.tweens.add({ targets: s, y: y + 70, angle: 25, alpha: 0, duration: 320, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
  }

  private rakna(namn?: string): void {
    if (!namn) return;
    const fore = this.summaVarde();
    this.antal[namn] = (this.antal[namn] ?? 0) + 1;
    const s = this.inst.summa;
    if (namn !== s?.raknare) return;
    this.visaSumma();
    // Ljud när värdet passerar en jämn multipel, t.ex. ett "ding" var 1 000:e portion.
    const lv = s.ljudVarje;
    if (lv && Math.floor(this.summaVarde() / lv.varde) > Math.floor(fore / lv.varde)) spela(lv.ljud);
  }

  /** När en våg är klar och det finns fler i brickor.vagor: nästa våg marscherar in. */
  private kollaVag(): void {
    const vagor = this.inst.brickor.vagor ?? [];
    // Med upprepaVagor börjar vågorna om när den sista är klar.
    if (this.inst.brickor.upprepaVagor && vagor.length && this.nastaVag >= vagor.length && this.rutnat.allaKlara()) this.nastaVag = 0;
    if (this.vagByte || this.nastaVag >= vagor.length || !this.rutnat.allaKlara()) return;
    const vag = vagor[this.nastaVag++];
    this.vagByte = true;
    if (vag.text) this.popup(MITT_X, HOJD * 0.55, vag.text, 'morkgron', 'ljusbeige');
    this.scene.time.delayedCall(700, () => {
      if (this.klar) return;
      const { text: _text, ...falt } = vag;
      this.rutnat = new Rutnat(this.scene, { ...this.inst.brickor, ...falt });
      this.vagByte = false;
    });
  }

  private skakaBricka(b: Bricka): void {
    const x = b.obj.x;
    this.scene.tweens.add({ targets: b.obj, x: x + 4, duration: 50, yoyo: true, repeat: 2, onComplete: () => b.obj.setX(x) });
  }

  private flyttaFangst(dt: number): void {
    const sp = this.inst.spelare;
    for (const f of this.fangst) {
      if (f.fangad || !f.obj.visible) continue;
      fallSteg(f, dt);
      const nara = Math.abs(f.obj.x - this.spelare.x) < sp.b / 2 + f.r && Math.abs(f.obj.y - this.spelare.y) < sp.h / 2 + f.r;
      if (nara) this.fanga(f);
      else if (f.obj.y - f.r > sp.y + sp.h / 2 + 8) {
        this.registreraMisstag(this.inst.misstag?.fangstMissad ?? 0, this.inst.misstagText?.fangstMissad, f.obj.x, this.inst.spelare.y - 60);
        aterstall(this.scene, f);
      }
    }
  }

  /** Strömmen av fångstobjekt: tillämpa typens onFangst eller onPass på dem som fångats eller passerat. */
  private flyttaStrom(dt: number): void {
    if (!this.strom) return;
    const sp = this.inst.spelare;
    const forlopp = this.inst.tid ? 1 - this.tidKvar / this.inst.tid.sekunder : 0;
    const { fangade, passerade } = this.strom.uppdatera(dt, forlopp, { x: this.spelare.x, y: sp.y, b: sp.b, h: sp.h });
    for (const o of fangade) this.tillampa(o.typ.onFangst, true, o.obj.x, sp.y - sp.h / 2 - 34);
    for (const o of passerade) this.tillampa(o.typ.onPass, false, o.obj.x, sp.y - sp.h / 2 - 34);
  }

  // ---------- Växande mål och timing-klipp ----------

  private vaxa(dt: number): void {
    if (!this.vaxande) return;
    const forlopp = this.inst.tid ? 1 - this.tidKvar / this.inst.tid.sekunder : 0;
    for (const m of this.vaxande.uppdatera(dt, forlopp)) this.tillampa(m.zon.vidMissat, false, m.x, this.textHojd());
  }

  /** Spelaren släppte fingret: klipp målet under verktyget och bedöm klippet efter zonens regler. */
  private klipp(): void {
    if (!this.vaxande) return;
    spela('snip');
    this.scene.tweens.add({ targets: this.spelare, scaleX: 0.85, duration: 70, yoyo: true });
    const k = this.vaxande.klipp(this.spelare.x);
    if (!k) return;
    const regel = k.bedomning === 'klipp' ? k.mal.zon.vidKlipp : k.mal.zon.vidForTidigt;
    this.tillampa(regel, false, k.mal.x, this.textHojd());
  }

  /** Pratbubblor vid klipp hamnar ovanför klipplinjen. */
  private textHojd(): number {
    return (this.inst.vaxande?.klipplinje.y ?? this.inst.spelare.y) - 44;
  }

  private tillampa(r: FangstRegel | undefined, fangad: boolean, x: number, y: number): void {
    const forsta = !!r && !this.visadEnGang.has(r);
    if (r) this.visadEnGang.add(r);
    const text = r?.textEnGang && !forsta ? undefined : r?.text;
    if (r?.matare) {
      // Ett misstag: blink, skakning och misstagsljudet (inget fångstljud), plus regelns eget ljud.
      this.registreraMisstag(r.matare, text, x, y);
      if (r.ljud) spela(r.ljud);
    } else {
      const ljud = r?.ljud ?? (fangad ? 'fanga' : undefined);
      if (ljud) spela(ljud);
      if (text) {
        // Neutral bubbla: mörkgrön, eller grön på mörk bakgrund (annars syns den inte).
        if (r?.ton === 'neutral') this.popup(x, y, text, this.niva.tema === 'mork' ? 'gron' : 'morkgron', 'ljusbeige');
        else this.popup(x, y, text, 'guld', 'morkgron');
      }
    }
    if (!r) return;
    if (r.knapp && forsta) this.visaKnapp(r.knapp);
    if (r.prat && forsta) visaTalbubbla(this.scene, r.prat.x, r.prat.y, r.prat.text, r.prat.farg, r.prat.textFarg, r.prat.langd);
    if (r.matareMjuk && this.inst.matare.lage !== 'fyll') {
      // Mätaren sjunker utan att det räknas som ett misstag: bara en kort markering.
      this.matarSteg = Math.min(this.inst.matare.steg, this.matarSteg + r.matareMjuk);
      this.hud.visaMatare(this.matarSteg);
      this.hud.markeraMatare();
    }
    this.poang += r.poang ?? 0;
    this.rakna(r.raknas);
    if (r.fyll && this.inst.matare.lage === 'fyll') {
      this.fyllSteg += r.fyll;
      this.hud.visaMatare(this.fyllSteg);
    }
    if (r.raknas && r.raknas === this.inst.etapper?.raknare) this.visaEtapp((this.antal[r.raknas] ?? 0) - 1);
  }

  /** Knappen från en fångstregel (t.ex. "Hoppa av kursen"). Med vinstvillkoret "knapp" avslutar ett tryck nivån/fasen. */
  private visaKnapp(etikett: string): void {
    const k = new Knapp(this.scene, MITT_X, HOJD * 0.5, etikett, { bredd: 240, variant: 'guld' }, () => {
      if (!this.aktiv() || !this.inst.vinst.includes('knapp')) return;
      k.destroy();
      this.vinna();
    }).setDepth(50);
    k.setScale(0.7);
    this.scene.tweens.add({ targets: k, scale: 1, duration: 260, ease: 'Back.easeOut' });
  }

  /** Räknarkortet med summan, t.ex. "1 333 kr". */
  private visaSumma(): void {
    const s = this.inst.summa;
    if (!s) return;
    this.hud.visaSumma(s.text.replace('{varde}', this.summaVarde().toLocaleString('sv-SE')));
  }

  /** Summans värde: round(totalt × fångade / antal), eller bara räknaren utan totalt och antal. */
  private summaVarde(): number {
    const s = this.inst.summa;
    if (!s) return 0;
    const fangade = this.antal[s.raknare] ?? 0;
    return s.totalt && s.antal ? Math.round((s.totalt * Math.min(fangade, s.antal)) / s.antal) : fangade;
  }

  /** Visar etapp nummer i (t.ex. trähusets tak) med en liten studs. */
  private visaEtapp(i: number): void {
    const del = this.etapper[i];
    if (!del || del.alpha > 0) return;
    del.setAlpha(0).setScale(0.6);
    this.scene.tweens.add({ targets: del, alpha: 1, scale: 1, duration: 320, ease: 'Back.easeOut' });
  }

  private fanga(f: Fangst): void {
    f.fangad = true;
    const mal = this.hud.fangstPlats(this.fangade++);
    spela('fanga');
    this.scene.tweens.add({ targets: f.obj, x: mal.x, y: mal.y, scale: 0.6, duration: 260, ease: 'Quad.easeOut' });
  }

  /** Prickad siktlinje rakt upp från spelaren medan fingret är nere. */
  private ritaSikte(): void {
    this.sikte.clear();
    if (!this.fingerNere || !this.inst.skott) return; // sköldläget har inget sikte
    const brickTopp = this.inst.brickor.skottGenom ? 0 : this.rutnat.nedersta() + 8;
    const topp = Math.max(brickTopp, (this.hot?.nedersta() ?? 0) + 8, (this.faktura?.nedersta() ?? 0) + 8, this.hud.tak);
    const botten = this.spelare.y - this.inst.spelare.h / 2 - 10;
    if (botten <= topp) return;
    this.sikte.lineStyle(2, farg.guld, 0.9);
    const punkter = [new Phaser.Math.Vector2(this.spelare.x, botten), new Phaser.Math.Vector2(this.spelare.x, topp)];
    streckadLinje(this.sikte, punkter, 2, 6);
  }

  // ---------- Misstag, vinst och förlust ----------

  /**
   * Brickor som nått spelaren släpps igenom enligt typens onPass (onPassDold om brickan fortfarande är dold).
   * Typer utan onPass stannar kvar. Passerar flera samtidigt visas varje text en gång, staplade under spelaren.
   * Bubblans färg: vinröd vid misstag (mätaren), mörkgrön vid poängavdrag eller räknad passage, annars guld.
   */
  private slappIgenom(): void {
    const sp = this.inst.spelare;
    const linje = sp.y - sp.h / 2;
    const texter = new Map<string, 'misstag' | 'avdrag' | 'bra'>();
    const vikt = { bra: 0, avdrag: 1, misstag: 2 };
    const ljud = new Set<Ljud>();
    for (const b of this.rutnat.brickor) {
      if (!b.levande) continue;
      if (this.rutnat.varldsMitt(b).y + this.inst.brickor.h / 2 < linje) continue;
      const typ = this.rutnat.typ(b);
      const regel: BottenRegel | undefined = b.data.dold ? (typ.onPassDold ?? typ.onPass) : typ.onPass;
      if (!regel) continue;
      this.rutnat.slappIgenom(b);
      this.poang += regel.poang ?? 0;
      this.rakna(regel.raknas);
      if (regel.matare) this.registreraMisstag(regel.matare);
      if (regel.ljud) ljud.add(regel.ljud);
      if (!regel.text) continue;
      const slag = regel.matare ? 'misstag' : (regel.poang ?? 0) < 0 || regel.raknas ? 'avdrag' : 'bra';
      const tidigare = texter.get(regel.text);
      if (!tidigare || vikt[slag] > vikt[tidigare]) texter.set(regel.text, slag);
    }
    ljud.forEach((l) => spela(l));
    let y = sp.y + sp.h / 2 + 26;
    for (const [text, slag] of texter) {
      if (slag === 'misstag') this.popup(MITT_X, y, text, 'vinrod', 'ljusbeige');
      else if (slag === 'avdrag') this.popup(MITT_X, y, text, 'morkgron', 'ljusbeige');
      else this.popup(MITT_X, y, text, 'guld', 'morkgron');
      y += 34;
    }
  }

  private popup(x: number, y: number, innehall: string, bakgrund: FargNamn, textFarg: FargNamn): void {
    const p = pratbubbla(this.scene, 0, 0, innehall, bakgrund, textFarg).setDepth(40);
    // Håll bubblan inom skärmen.
    const halv = p.getBounds().width / 2 + 8;
    p.setPosition(Phaser.Math.Clamp(x, halv, BREDD - halv), y).setScale(0.6);
    this.scene.tweens.add({ targets: p, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: p, y: y - 18, alpha: 0, delay: 1300, duration: 400, onComplete: () => p.destroy() });
  }

  private registreraMisstag(steg: number, text?: string, x = MITT_X, y = HOJD / 2): void {
    if (text) this.popup(x, y, text, 'vinrod', 'ljusbeige');
    this.misstag += 1;
    // En mätare med lage "fyll" visar det som gått bra; misstagen påverkar den inte.
    if (this.inst.matare.lage !== 'fyll') {
      this.matarSteg = Math.min(this.inst.matare.steg, this.matarSteg + steg);
      this.hud.visaMatare(this.matarSteg);
      this.hud.markeraMatare();
    }
    spela('misstag');
    this.scene.cameras.main.shake(160, 0.004);
    if (this.klocka - this.sistaBlink >= MIN_BLINK_MS) {
      this.sistaBlink = this.klocka;
      this.blink.setAlpha(0.3);
      this.scene.tweens.add({ targets: this.blink, alpha: 0, duration: 320 });
    }
  }

  private kollaSlut(): void {
    const f = this.inst.forlust;
    const sp = this.inst.spelare;
    if (f.includes('matare-full') && this.matarSteg >= this.inst.matare.steg) return this.forlora('matare-full');
    if (f.includes('tid-slut') && this.tidKvar <= 0) return this.forlora('tid-slut');
    if (f.includes('botten') && this.rutnat.nedersta() >= sp.y - sp.h / 2) return this.forlora('botten');
    const mange = this.inst.forManga;
    if (f.includes('for-manga') && mange && (this.antal[mange.raknare] ?? 0) > mange.max) return this.forlora('for-manga');
    const mal = this.inst.mal;
    const malNatt = !!mal && (this.antal[mal.raknare] ?? 0) >= mal.antal;
    if (f.includes('mal-omojligt') && mal && this.strom && !malNatt) {
      const kvar = this.strom.kvar((t) => t.onFangst?.raknas === mal.raknare);
      if ((this.antal[mal.raknare] ?? 0) + kvar < mal.antal) return this.forlora('mal-omojligt');
    }

    const v = this.inst.vinst;
    const felBorta = !v.includes('fel-borta') || this.rutnat.felKvar() === 0;
    const allaFangade = !v.includes('alla-fangade') || this.fangst.every((x) => x.fangad);
    // Med fler vågor kvar är nivån inte klar än.
    if (this.vagByte || this.nastaVag < (this.inst.brickor.vagor?.length ?? 0)) {
      if (v.includes('alla-klara') || v.includes('fel-borta')) return;
    }
    const allaKlara = !v.includes('alla-klara') || this.rutnat.allaKlara();
    const overlevt = !v.includes('overlev') || this.tidKvar <= 0;
    const malKlart = !v.includes('mal') || malNatt;
    // Vinstvillkoret "knapp" avgörs bara av knappen (visaKnapp).
    if (v.includes('knapp')) return;
    if (felBorta && allaFangade && allaKlara && overlevt && malKlart) this.vinna();
  }

  private forlora(orsak: ForlustOrsak): void {
    this.klar = true;
    this.avslutaStyrning();
    spela('misstag');
    this.scene.cameras.main.shake(260, 0.006);
    this.kontext.avsluta({ poang: this.poang, skadestand: 0, nollstallt: true, misstag: this.misstag, tidKvar: this.tidKvar, matareKvar: this.matareKvar(), dekorForlorade: this.dekor?.forlorade(), antal: this.antal, forlust: orsak });
  }

  private vinna(): void {
    this.klar = true;
    this.avslutaStyrning();
    let tid = this.bildaSlutrad();
    if (this.handelser?.harVinst()) {
      // Scriptad avslutning: allt fryser, händelsen spelas och domslutet kommer när den är klar.
      this.slutscen = true;
      tid = Math.max(tid, this.handelser.startaVinst() + 300);
      if (this.handelser.kanHoppas() && framsteg.arKlar(this.niva.id)) this.erbjudHoppa();
    }
    this.slutTimer = this.scene.time.delayedCall(tid, () => this.rapporteraVinst());
  }

  private slutTimer?: Phaser.Time.TimerEvent;

  /** Efter första gången: ett tryck hoppar över den scriptade avslutningen. */
  private erbjudHoppa(): void {
    // Texten på en liten mörk lapp längst ner, så att den syns oavsett vad som ligger bakom.
    const t = skapaText(this.scene, MITT_X, HOJD - 22, text.niva.hoppaOver, 'liten', 'ljusbeige', { origo: [0.5, 0.5], storlek: 12 }).setDepth(46);
    this.scene.add.graphics().setDepth(45).fillStyle(farg.morkgron, 0.92).fillRoundedRect(t.x - t.width / 2 - 14, t.y - 13, t.width + 28, 26, 13);
    // En kort fördröjning, så att fingret som släpps efter sista skottet inte hoppar över av misstag.
    this.scene.time.delayedCall(350, () =>
      this.scene.input.once('pointerup', () => {
        if (!this.slutTimer || this.slutTimer.getOverallProgress() >= 1) return;
        this.slutTimer.remove(false);
        this.rapporteraVinst();
      }),
    );
  }

  private rapporteraVinst(): void {
    this.kontext.avsluta({
      poang: this.poang,
      skadestand: 0,
      nollstallt: false,
      misstag: this.misstag,
      tidKvar: Math.max(0, this.tidKvar),
      matareKvar: this.matareKvar(),
      dekorForlorade: this.dekor?.forlorade(),
      antal: this.antal,
    });
  }

  /** Flyttar brickor och fångstobjekt med "plats" till en rad, t.ex. KROGKUNG. Returnerar animationens längd (ms). */
  private bildaSlutrad(): number {
    const rad = this.inst.slutrad;
    if (!rad) return 300;
    this.instruktion?.destroy();
    // "storlek" = objektets bredd i full skala, så att allt i raden blir lika högt.
    const delar: { plats: number; obj: Phaser.GameObjects.Container; storlek: number }[] = [];
    for (const b of this.rutnat.brickor) {
      if (b.levande && b.data.plats !== undefined) delar.push({ plats: b.data.plats, obj: this.rutnat.lyftUt(b), storlek: this.inst.brickor.b });
    }
    for (const f of this.fangst) if (f.data.plats !== undefined) delar.push({ plats: f.data.plats, obj: f.obj, storlek: f.r * 2 });
    delar.sort((a, b) => a.plats - b.plats);
    this.rutnat.tonaUtResten();

    const steg = Math.min(44, (BREDD - avstand.l * 2) / Math.max(delar.length, 1));
    const x0 = MITT_X - (steg * (delar.length - 1)) / 2;
    delar.forEach((d, i) => {
      d.obj.setDepth(30);
      this.scene.tweens.add({
        targets: d.obj,
        x: x0 + i * steg,
        y: rad.y,
        scale: (steg - 4) / d.storlek,
        delay: i * 60,
        duration: 420,
        ease: 'Cubic.easeInOut',
      });
    });
    return 420 + delar.length * 60 + 1200;
  }

  /** Procent kvar på mätaren. */
  private matareKvar(): number {
    return Math.max(0, ((this.inst.matare.steg - this.matarSteg) / this.inst.matare.steg) * 100);
  }

  /** Fallande hot: släpp nya, flytta, och hantera dem som nått spelaren enligt hot.botten. */
  private flyttaHot(dt: number): void {
    if (!this.hot || !this.inst.hot) return;
    const sp = this.inst.spelare;
    const forlopp = this.inst.tid ? 1 - this.tidKvar / this.inst.tid.sekunder : 0;
    const alla = this.hot.uppdatera(dt, forlopp, sp.y - sp.h / 2);
    // Hot av en sort (hot.typer) följer sortens vidBotten; övriga hot.botten som förut.
    for (const h of alla) if (h.typ) this.tillampa(h.typ.vidBotten, false, h.x, sp.y - sp.h / 2 - 34);
    const nadde = alla.filter((h) => !h.typ);
    if (nadde.length === 0) return;
    const regel = this.inst.hot.botten;
    for (let i = 0; i < nadde.length; i++) {
      this.poang += regel.poang ?? 0;
      if (regel.matare) this.registreraMisstag(regel.matare);
    }
    if (regel.text) {
      const misstag = !!regel.matare;
      this.popup(MITT_X, sp.y + sp.h / 2 + 26, regel.text, misstag ? 'vinrod' : 'guld', misstag ? 'ljusbeige' : 'morkgron');
    }
  }

  private avslutaStyrning(): void {
    this.hot?.stoppa();
    this.skyttar?.stoppa();
    this.strom?.stoppa();
    this.fingerNere = false;
    this.sikte.clear();
    this.skott.forEach((s) => s.destroy());
    this.skott = [];
  }

  // ---------- Mekanik-gränssnittet ----------

  pausa(pausad: boolean): void {
    this.pausad = pausad;
    if (pausad) {
      this.fingerNere = false;
      this.sikte.clear();
    }
  }

  forstor(): void {
    this.scene.input.off('pointerdown', this.ner, this);
    this.scene.input.off('pointermove', this.flytta, this);
    this.scene.input.off('pointerup', this.upp, this);
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }
}
