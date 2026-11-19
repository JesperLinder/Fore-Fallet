# Före fallet

Ett prejudikatspel från Advokatfirman Fylgia. Phaser 3 + TypeScript + Vite, Matter.js för fysiken.
Porträttläge, logisk upplösning 390×844 (skalas med `Phaser.Scale.FIT`).

## Starta

```bash
npm install
npm run dev -- --host
```

Öppna adressen som står vid `Network:` i mobilens webbläsare (samma wifi).

Övriga kommandon:

- `npm run build`: typkontroll + produktionsbygge till `dist/`
- `npm run preview`: kör det byggda spelet lokalt
- `npm run typecheck`: bara typkontroll

Rensa sparade framsteg: kör `localStorage.removeItem('forefallet.framsteg.v1')` i webbläsarens konsol.

## Publicering på GitHub Pages

Varje push till `main` bygger spelet (`npm run build`) och publicerar det automatiskt
(`.github/workflows/pages.yml`). Spelet hamnar på:

**https://jesperlinder.github.io/Fore-Fallet/** (stora F, adressen är skiftlägeskänslig)

Det tar ett par minuter från push tills sidan är uppdaterad. Hur det gick syns under fliken **Actions** i repot.
Arbetsflödet kan också köras för hand där: välj "Publicera på GitHub Pages", sedan **Run workflow**.

**Första gången måste GitHub Pages slås på** (annars misslyckas steget "publicera"):

1. Gå till repot på GitHub och sedan **Settings**, **Pages** (i vänstermenyn under "Code and automation").
2. Under **Build and deployment** och **Source**, välj **GitHub Actions**.
3. Klart. Kör arbetsflödet igen under **Actions** eller gör en ny push till `main`.

Är repot privat kräver GitHub Pages ett betalt GitHub-konto (Pro, Team eller Enterprise). Med ett gratiskonto måste repot vara publikt.

**Base-sökväg:** lokalt och i Capacitor används relativ base (`./` i `vite.config.ts`).
Pages-bygget sätter base till `/<repo-namn>/` med `--base`, så det fungerar även om repot byter namn.

## Struktur

```
src/
  main.ts                 startar Phaser och registrerar scenerna
  config/theme.ts         färger, typsnitt, avstånd, radier
  config/strings.ts       alla gemensamma texter (svenska)
  config/display.ts       logisk upplösning och pixeltäthet
  core/levelTypes.ts      nivåformatet (TypeScript-typer, dokumenterade)
  core/levels.ts          läser in src/levels/*.json, upplåsning
  core/progress.ts        sparar stjärnor och ljudval (ENDA stället som rör localStorage)
  core/sound.ts           ljudeffekter med Web Audio (inga ljudfiler)
  core/scoring.ts         poäng → stjärnor
  scenes/                 Boot, Title, Map, Level, Verdict (+ BaseScene)
  mechanics/              Slingshot.ts, Invaders.ts, registry.ts, art.ts (figurer)
  mechanics/slingshot/    flygmodell, bana, resultatrad
  mechanics/invaders/     brickornas rutnät, fallande objekt, HUD (tid, inforuta, mätare)
  levels/                 en JSON-fil per nivå
  ui/                     knappar, text, stjärnor, paneler, märken, scroll
  platform/openLink.ts    öppnar externa länkar (Capacitor Browser i appen, ny flik på webben)
public/assets/            Fylgias logotyp och symbol (SVG ur varumärkesmanualen)
public/icon.svg           appikon/favicon, icon-1024.png är samma i 1024×1024 för iOS
```

## Lägga till en nivå

1. Kopiera `src/levels/niva-01.json` till `src/levels/niva-NN.json` (eller fyll på en platshållare).
2. Ändra `id` (unikt), `nummer`, `titel`, `referens`, texterna, `objekt` och `domslut`.
3. Klart. Kartan läser in filen automatiskt och sorterar på `nummer`.

En nivå räknas som spelbar när filen har `objekt` och `domslut` och mekaniken är byggd.
Den låses upp när föregående nivå har minst en stjärna (`STJARNOR_FOR_NASTA` i `src/core/levels.ts`).
Filer som börjar med `_` (mallar) läses inte in.

### Nivåformatet i korthet

Se `src/core/levelTypes.ts` för alla fält med kommentarer.

| Fält | Betydelse |
|---|---|
| `id`, `nummer`, `titel`, `referens` | identitet och visning på kartan |
| `mekanik` | `"slingshot"` eller `"invaders"` |
| `fylgiaMal` | visar märket "Fylgia-mål" |
| `etikett` | valfri text på kartan i stället för mekaniknamnet ("Boss", "Final") |
| `uppdragstext`, `fylgiaTips` | visas i rutan "Din fylgia viskar" |
| `resultat` | `"vinst"` eller `"halvvagsvinst"` (max 1,5 stjärnor) |
| `stjarngranser` | poäng för 1, 2 och 3 stjärnor (slangbella) |
| `stjarnkrav` | krav på misstag och tid kvar för 1, 2 och 3 stjärnor (invaders) |
| `tema` | `"mork"` för mörk bakgrund (ljusa rubriker) |
| `bana.lager` | bakgrundens färglager uppifrån och ner |
| `slangbella` | antal skott, kraft, friktion, vind/slice, spelplan, rubriker i resultatraden |
| `invaders` | spelare, skott, brickor, fångstobjekt, skydd, tid, mätare, vinst- och förlustvillkor (se nedan) |
| `forlust` | rubrik (och valfria orsakstexter) på förlustskärmen |
| `objekt` | `utslag`, `mal` (målyta med poäng), `hinder` (skadestånd, sänker mätaren, kan nollställa stjärnorna), `zon`, `linje`, `etikett`, `dekor` |
| `domslut` | `rubrik`, `text` (valfri), `domskal` (3 st), `lankTillFallet`, `utfall` per antal stjärnor, och `vunnet`/`inteVunnet` för halvvägsvinst |

Objekt med `utseende` (t.ex. `"bil"`, `"golfboll"`) hämtar figuren från `src/mechanics/art.ts`.
Behövs en helt ny figur är det enda stället som kräver kod. Alternativt kan den läggas som bild i `public/assets/`,
men det finns inget stöd för bildfiler i nivåformatet än.

### Invaders-nivåer

Mekaniken styrs helt av blocket `invaders` i nivåfilen. Mallen `src/levels/_mall-invaders.json` och förklaringen
`src/levels/_mall-invaders.md` beskriver varje fält. Så här ser nivå 2 (Löpsedeln) ut i förkortad form:

```json
"tema": "mork",
"stjarnkrav": { "tre": { "maxMisstag": 0, "tidKvarOver": 20 }, "tva": { "maxMisstag": 1 }, "en": {} },
"invaders": {
  "spelare": { "utseende": "textmarkor", "y": 716, "b": 30, "h": 48 },
  "skott": { "lage": "slapp", "intervall": 220, "fart": 1000 },
  "brickor": {
    "rader": [
      [{ "etikett": "K", "typ": "ratt", "plats": 0 }, { "etikett": "N", "typ": "fel" }, …],
      [{ "etikett": "K", "typ": "ratt", "plats": 4 }, …]
    ],
    "b": 60, "h": 48, "mellanrum": 10, "forskjutning": [0, 35], "startY": 160,
    "steg": { "x": 3, "ned": 14, "intervall": 280 },
    "kant": { "vanster": 16, "hoger": 374 }
  },
  "fangst": [{ "etikett": "O", "x": 150, "y": 300, "fart": 16, "plats": 2 }, …],
  "skydd": [{ "etikett": "RÄTTELSE", "x": 82, "y": 540, "b": 84, "h": 30, "talighet": 4 }, …],
  "tid": { "sekunder": 60, "etikett": "Pressläggning om" },
  "matare": { "namn": "Förtalsrisk", "steg": 4, "status": "Ensamansvar: på" },
  "misstag": { "rattTraffad": 1, "fangstMissad": 1 },
  "info": [{ "etikett": "Rätt rubrik:", "varde": "KROGKUNG", "serif": true }, { "etikett": "Utgivare:", "varde": "DU" }],
  "instruktion": { "text": "Fånga rätt bokstäver – skjut bort fel", "y": 402 },
  "vinst": ["fel-borta", "alla-fangade"],
  "forlust": ["matare-full", "tid-slut", "botten"],
  "slutrad": { "y": 420 }
},
"forlust": { "rubrik": "Tryckt. Förtal." }
```

**Styrning:** spelaren drar var som helst på skärmen för att flytta markören i sidled, och släpper för att skjuta.
Rörelsen är relativ, så tummen skymmer inte figuren. Släpp-för-att-skjuta är valt för att varje skott ska vara ett
medvetet val när fel skott kostar. Med `"lage": "auto"` skjuter spelaren i stället hela tiden medan fingret är nere.

**Ljud:** skott, träff, fångst, misstag och vinst spelas med Web Audio. Ljudet slås av och på med högtalarknappen på kartan.

## Platshållare

- **Nivå 3–10** är platshållare (bara `id`, `nummer`, `titel`, `referens`, `mekanik`, `fylgiaMal`, ev. `etikett`). De syns låsta på kartan.
- **Typsnitt**: Newsreader och Instrument Sans från Google Fonts. Byts mot ABC Arizona i `src/config/theme.ts` + `index.html`.
- **Logotyp**: den riktiga, extraherad som vektor ur KAN:s varumärkesmanual (2026-11-16). Filerna är vita och färgas i spelet (`src/ui/Logo.ts`).
- **Spelvärden** för nivå 1 (kraft, vind, skadestånd 25 000 kr, mätaren −50 per bilträff) är mina gissningar och behöver provspelas.
- **Domslutstexterna** `domslut.text` och `utfall` för nivå 1 har jag skrivit själv. De bör granskas.
- **Capacitor** är installerat och konfigurerat (`capacitor.config.ts`), men det finns ingen iOS-plattform. När det är dags: `npm run build && npx cap add ios`.
