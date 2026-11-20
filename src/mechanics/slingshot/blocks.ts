/**
 * Fysikblock för slangbella i sidovy: block och plattformar från nivåfilens "objekt" (typ "block"/"plattform").
 * Blocken är vanliga Matter-kroppar som staplas, välter och faller. De sover från start (ligger helt still)
 * och väcks alla på en gång när projektilen träffar något block, så att inget svävar kvar.
 * Ett block är nedslaget när det lämnat sin plattform, hamnat under nedLinje eller åkt utanför skärmen.
 */
import Phaser from 'phaser';
import { farg } from '../../config/theme';
import { BREDD, HOJD } from '../../config/display';
import type { BlockObjekt, Niva, PlattformObjekt } from '../../core/levelTypes';
import { spela } from '../../core/sound';
import { skapaText } from '../../ui/text';
import { ritaFigur } from '../art';
import type { MatterKropp } from './launcher';

const DJUP_BLOCK = 4.5;
/** Matters Sleeping-modul (finns i Phaser men saknas i dess typer). */
const Sovande = (Phaser.Physics.Matter as unknown as { Matter: { Sleeping: { set(kropp: MatterKropp, sover: boolean): void } } })
  .Matter.Sleeping;
/** Papper: luftmotstånd och hur mycket det vrider sig och driver i sidled när det faller. */
const PAPPER_LUFT = 0.05;
const FLADDER_VRID = 0.0025;
const FLADDER_DRIFT = 0.06;

export interface Block {
  data: BlockObjekt;
  kropp: MatterKropp;
  obj: Phaser.GameObjects.Container;
  ned: boolean;
  /** Landningsljudet har spelats. */
  landat: boolean;
  fas: number;
}

export class Fysikblock {
  readonly block: Block[];
  private plattformar = new Map<string, PlattformObjekt>();
  private statiska = new Set<number>();
  private tid = 0;

  /** vidNed anropas en gång per block när det blivit nedslaget. */
  constructor(
    private scene: Phaser.Scene,
    niva: Niva,
    private nedLinje: number,
    mark: number,
    private vidNed: (b: Block) => void,
  ) {
    this.scene.matter.world.engine.enableSleeping = true;
    // Marken: en fast kropp under markytan, bredare än skärmen.
    const markKropp = this.scene.matter.add.rectangle(BREDD / 2, mark + 100, BREDD * 3, 200, { isStatic: true, label: 'mark' });
    this.statiska.add(markKropp.id);

    for (const o of niva.objekt) if (o.typ === 'plattform') this.byggPlattform(o);
    this.block = niva.objekt.filter((o): o is BlockObjekt => o.typ === 'block').map((d) => this.byggBlock(d));

    this.scene.matter.world.on('collisionstart', this.kollision, this);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
  }

  /** Antal block med "mal" som står kvar. */
  malKvar(): number {
    return this.block.filter((b) => b.data.mal && !b.ned).length;
  }

  arNed(id: string): boolean {
    return this.block.some((b) => b.data.id === id && b.ned);
  }

  /** Sant om kroppen är ett block av papper (för prasslet). */
  arPapper(kropp: MatterKropp): boolean {
    return this.block.some((b) => b.kropp === kropp && b.data.papper);
  }

  arBlock(kropp: MatterKropp): boolean {
    return this.block.some((b) => b.kropp === kropp);
  }

  /** Väcker alla block (när något träffas), så att de som stod ovanpå också faller. */
  vackAlla(): void {
    for (const b of this.block) if (b.kropp.isSleeping) Sovande.set(b.kropp, false);
  }

  /** Sant när inget vaket block rör sig nämnvärt längre. */
  iVila(): boolean {
    return this.block.every((b) => b.kropp.isSleeping || !b.obj.visible || (b.kropp.speed < 0.1 && b.kropp.angularSpeed < 0.01));
  }

  forstor(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.uppdatera, this);
    const varld = this.scene.matter.world as Phaser.Physics.Matter.World | null;
    varld?.off('collisionstart', this.kollision, this);
  }

  // ---------- Bygg ----------

  private byggPlattform(p: PlattformObjekt): void {
    this.plattformar.set(p.id, p);
    const kropp = this.scene.matter.add.rectangle(p.x, p.y, p.b, p.h, { isStatic: true, label: 'plattform', friction: 1 });
    this.statiska.add(kropp.id);
    this.scene.add.graphics().setDepth(DJUP_BLOCK - 0.1).fillStyle(farg[p.farg], 1).fillRect(p.x - p.b / 2, p.y - p.h / 2, p.b, p.h);
    if (p.etikett) {
      skapaText(this.scene, p.x, p.y + p.h / 2 + 18, p.etikett, 'overrubrik', 'beige', { origo: [0.5, 0.5], storlek: 11 }).setDepth(DJUP_BLOCK);
    }
  }

  private byggBlock(d: BlockObjekt): Block {
    const kropp = this.scene.matter.add.rectangle(d.x, d.y, d.b, d.h, {
      label: 'block',
      density: d.vikt,
      friction: 0.4,
      frictionStatic: 0.6,
      frictionAir: d.papper ? PAPPER_LUFT : 0.01,
      restitution: 0.05,
    });
    // Sover tills något träffar det: ingen darrning eller glidning före första skottet.
    Sovande.set(kropp, true);
    const g = this.scene.add.graphics();
    ritaFigur(g, d.utseende, 0, 0, d.b, d.h);
    const delar: Phaser.GameObjects.GameObject[] = [g];
    if (d.etikett) {
      delar.push(skapaText(this.scene, d.b / 2 - 8, d.h / 2 - 8, d.etikett, 'knapp', 'morkgron', { origo: [1, 1], storlek: 11 }));
    }
    const obj = this.scene.add.container(d.x, d.y, delar).setDepth(DJUP_BLOCK);
    return { data: d, kropp, obj, ned: false, landat: false, fas: Math.random() * Math.PI * 2 };
  }

  // ---------- Varje bildruta ----------

  private uppdatera(_t: number, dt: number): void {
    this.tid += dt;
    for (const b of this.block) {
      const k = b.kropp;
      b.obj.setPosition(k.position.x, k.position.y).setRotation(k.angle);
      if (b.data.papper && !k.isSleeping && k.velocity.y > 0.6) this.fladdra(b);
      if (!b.ned && this.harFallit(b)) {
        b.ned = true;
        this.vidNed(b);
      }
      // Långt nedanför skärmen: ta bort kroppen (blocket är redan nedslaget).
      if (k.position.y > HOJD + 200 && b.obj.visible) {
        this.scene.matter.world.remove(k);
        b.obj.setVisible(false);
      }
    }
  }

  /** Papper som faller vrider sig fram och tillbaka och driver lite i sidled. */
  private fladdra(b: Block): void {
    const s = Math.sin(this.tid / 180 + b.fas);
    const Kropp = this.scene.matter.body;
    Kropp.setAngularVelocity(b.kropp, b.kropp.angularVelocity + s * FLADDER_VRID);
    Kropp.setVelocity(b.kropp, { x: b.kropp.velocity.x + s * FLADDER_DRIFT, y: b.kropp.velocity.y });
  }

  private harFallit(b: Block): boolean {
    const { x, y } = b.kropp.position;
    if (y > this.nedLinje || x < -40 || x > BREDD + 40) return true;
    const p = b.data.plattform ? this.plattformar.get(b.data.plattform) : undefined;
    if (!p) return false;
    // Har lämnat plattformen: mittpunkten utanför dess bredd, eller under dess överkant.
    return Math.abs(x - p.x) > p.b / 2 || y > p.y - p.h / 2;
  }

  /** Landningsljud: ett nedslaget block som slår i marken eller en plattform. */
  private kollision(e: Phaser.Physics.Matter.Events.CollisionStartEvent): void {
    for (const par of e.pairs) {
      for (const [a, annan] of [[par.bodyA, par.bodyB], [par.bodyB, par.bodyA]]) {
        const b = this.block.find((x) => x.kropp === a);
        if (!b || !b.ned || b.landat || !b.data.landningsljud || !this.statiska.has(annan.id)) continue;
        b.landat = true;
        spela(b.data.landningsljud);
      }
    }
  }
}
