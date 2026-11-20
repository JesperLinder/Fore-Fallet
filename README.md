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
  mechanics/              Slingshot.ts, Invaders.ts, Hybrid.ts, registry.ts, art.ts (figurer)
  mechanics/slingshot/    kastaren (launcher.ts: slangbella, sikte, flygning), flygmodell, bana, resultatrad
  mechanics/invaders/     brickornas rutnät, fallande objekt, HUD (tid, inforuta, mätare)
  mechanics/hybrid/       hybridens HUD: borgenärsrutan, valknappar, hur fiender ritas
  mechanics/common/       delat: formation.ts (marscherande rutnät), startPanel.ts (Starta-rutan)
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
| `mekanik` | `"slingshot"`, `"invaders"` eller `"hybrid"` |
| `fylgiaMal` | visar märket "Fylgia-mål" |
| `etikett` | valfri text på kartan i stället för mekaniknamnet ("Boss", "Final") |
| `uppdragstext`, `fylgiaTips` | visas i rutan "Din fylgia viskar" |
| `resultat` | `"vinst"` eller `"halvvagsvinst"` (domslutet visar då rutorna Vunnet / Inte vunnet). Båda ger 0–3 stjärnor. |
| `guldstjarna` | valfritt: `{ "krav": {…}, "text": "Alla kor kvar i hagen." }`. En extra guldstjärna för en särskild bedrift, med samma kravfält som `stjarnkrav`. Visas på domslutet och kartan men räknas inte i stjärnräknaren och påverkar inte upplåsningen. |
| `stjarngranser` | poäng för 1, 2 och 3 stjärnor (slangbella) |
| `stjarnkrav` | krav för 1, 2 och 3 stjärnor: `maxMisstag`, `tidKvarOver`, `minMatare`, `maxDekorForlorade`, `maxAntal` (invaders), `maxForsok`, `maxFallor` (hybrid) |
| `tema` | `"mork"` för mörk bakgrund (ljusa rubriker) |
| `bana.lager` | bakgrundens färglager uppifrån och ner |
| `slangbella` | antal skott, kraft, friktion, vind/slice (valfritt `vind.variation` = slumpad per skott), `siktlinje` (andel av banan som visas, 0–1), spelplan, rubriker i resultatraden |
| `invaders` | spelare, skott, brickor, fångstobjekt, skydd, tid, mätare, vinst- och förlustvillkor (se nedan) |
| `hybrid` | kastfysik, projektiler, mål, studsyta, fiender och faragräns (se nedan) |
| `forlust` | rubrik (och valfria orsakstexter) på förlustskärmen |
| `objekt` | `utslag`, `mal` (målyta med poäng), `hinder` (skadestånd, sänker mätaren, kan nollställa stjärnorna), `zon`, `linje`, `etikett`, `dekor` (valfritt `b`/`h`), `text` |
| `domslut` | `rubrik`, `underrubrik` (valfri kursiv rad), `text` (valfri), `domskal` (3 st), `fylgiaruta` (lila ruta, bara Fylgia-mål), `lankTillFallet`, `utfall` per antal stjärnor, och `vunnet`/`inteVunnet` för halvvägsvinst (utan `inteVunnet` visas bara Vunnet-rutan, i full bredd) |

Objekt med `utseende` (t.ex. `"bil"`, `"golfboll"`) hämtar figuren från `src/mechanics/art.ts`.
Behövs en helt ny figur är det enda stället som kräver kod. Alternativt kan den läggas som bild i `public/assets/`,
men det finns inget stöd för bildfiler i nivåformatet än.

### Invaders-nivåer

Mekaniken styrs helt av blocket `invaders` i nivåfilen. Brickorna har typer som nivåfilen själv definierar i
`brickor.typer`: varje typ anger utseende, vad som händer vid träff (`onHit`) och när brickan når spelaren (`onPass`).
Så kan en nivå vara "skjut bort det felaktiga" (Löpsedeln) eller tvärtom "skjut bara på det rätta" (Kolsyretuberna)
utan ny kod. I Löpsedeln byts varje bortskjuten fel-bokstav direkt mot rätt bokstav (`ersattning`), så raden blir KROG KUNG. Fallande fångstobjekt (`fangst`) finns kvar som valfri byggsten för andra nivåer. Mallen `src/levels/_mall-invaders.json` och förklaringen
`src/levels/_mall-invaders.md` beskriver varje fält. Så här ser nivå 2 (Löpsedeln) ut i förkortad form:

```json
"tema": "mork",
"stjarnkrav": { "tre": { "maxMisstag": 0, "tidKvarOver": 10 }, "tva": { "maxMisstag": 1 }, "en": {} },
"invaders": {
  "spelare": { "utseende": "textmarkor", "y": 716, "b": 30, "h": 48 },
  "skott": { "lage": "slapp", "intervall": 220, "fart": 1000 },
  "brickor": {
    "typer": {
      "fel": { "stil": "mork", "skaBort": true, "onHit": { "effekt": "ta-bort", "ersattTyp": "ratt" } },
      "ratt": { "stil": "ljus", "smalTraff": 3, "onHit": { "effekt": "skaka", "misstag": true, "matare": 1 } }
    },
    "rader": [
      [{ "etikett": "K", "typ": "ratt", "plats": 0 }, { "etikett": "N", "typ": "fel", "plats": 1, "ersattning": "R" }, …],
      [{ "etikett": "K", "typ": "ratt", "plats": 4 }, …]
    ],
    "b": 60, "h": 48, "mellanrum": 10, "forskjutning": [0, 35], "startY": 160,
    "steg": { "x": 3, "ned": 14, "intervall": 280 },
    "kant": { "vanster": 16, "hoger": 374 }
  },
  "skydd": [{ "etikett": "RÄTTELSE", "x": 82, "y": 540, "b": 84, "h": 30, "talighet": 4 }, …],
  "tid": { "sekunder": 20, "etikett": "Pressläggning om" },
  "matare": { "namn": "Förtalsrisk", "steg": 4, "status": "Ensamansvar: på" },
  "info": [{ "etikett": "Rätt rubrik:", "varde": "KROGKUNG", "serif": true }, { "etikett": "Utgivare:", "varde": "DU" }],
  "instruktion": { "text": "Skjut bort fel bokstav – rätt dyker upp", "y": 402 },
  "vinst": ["fel-borta"],
  "forlust": ["matare-full", "tid-slut", "botten"],
  "slutrad": { "y": 420 }
},
"forlust": { "rubrik": "Tryckt. Förtal." }
```

**Reveal (nivå 4, Begagnade bilen):** en bricka med `"dold": { "etikett": "Ej kontrollerad" }` visas som okänd tills den
träffas första gången. Då avslöjas typen och etiketten med en stämpelanimation och ett klick, och brickan ligger kvar.
`onPass` avgör vad som händer när en bricka når spelaren, och `onPassDold` om den fortfarande är okänd. I förkortad form:

```json
"stjarnkrav": { "tre": { "minMatare": 100 }, "tva": { "minMatare": 75 }, "en": {} },
"invaders": {
  "spelare": { "utseende": "stampel", "y": 686, "b": 72, "h": 72, "etikett": "BIL-\nREGISTRET" },
  "skott": { "lage": "slapp", "intervall": 200, "fart": 1000, "utseende": "stampelavtryck" },
  "brickor": {
    "typer": {
      "fel": { "stil": "mork", "skaBort": true, "onHit": { "effekt": "ta-bort" },
               "onPass": { "matare": 50, "text": "Bilen var inte säljarens" },
               "onPassDold": { "matare": 25, "text": "Du kollade inte registret" } },
      "ratt": { "stil": "ljus", "smalTraff": 3,
                "onHit": { "effekt": "skaka", "misstag": true, "matare": 10, "text": "Du tackade nej till en bra bil" },
                "onPass": { "poang": 1, "text": "Köpt!" },
                "onPassDold": { "matare": 25, "text": "Du kollade inte registret" } }
    },
    "rader": [[{ "etikett": "Säljare = ägare", "typ": "ratt", "dold": { "etikett": "Ej kontrollerad" } }, …], …],
    "blanda": true, "fastBredd": true, "ikon": "bilsiluett",
    "b": 104, "h": 72, "mellanrum": 12, "startY": 196, "steg": { "x": 4, "ned": 22, "intervall": 230 },
    "kant": { "vanster": 16, "hoger": 374 }
  },
  "matare": { "namn": "God tro", "steg": 100, "visning": "procent" },
  "vinst": ["alla-klara"],
  "forlust": ["matare-full"]
}
```

**Fallande hot och dekorhändelser (nivå 5, De försvunna korna):** `hot` är föremål som faller och ska skjutas ner,
till exempel uppsägningsbrev från ufona. `dekor` är bakgrundshändelser med en räknare, till exempel kor som lyfts upp
var 7:e sekund. Med `handelse.raddning` kan spelaren skjuta ufot under lyftet, så att kon faller tillbaka. Ufona är
brickor med `figur` och `skottGenom`, så skotten går annars igenom dem. Nivån vinns med `vinst: ["overlev"]`, det vill
säga när tiden går ut, och guldstjärnan kräver att alla kor finns kvar (`maxDekorForlorade: 0`). Med
`matare.visning: "kort"` står klockan i ett eget kort bredvid mätaren och räknaren. Alla fält beskrivs i
`src/levels/_mall-invaders.md`. I förkortad form:

```json
"resultat": "halvvagsvinst",
"stjarnkrav": { "tre": { "maxMisstag": 0 }, "tva": { "maxMisstag": 2 }, "en": {} },
"guldstjarna": { "krav": { "maxDekorForlorade": 0 }, "text": "Alla kor kvar i hagen." },
"invaders": {
  "brickor": { "typer": { "ratt": { "stil": "ljus" } }, "rader": [[{ "etikett": "Ufo", "typ": "ratt" }, null, null], [null, null, { "etikett": "Ufo", "typ": "ratt" }]],
               "figur": "ufo", "skottGenom": true, "steg": { "x": 3, "ned": 0, "intervall": 40 }, … },
  "hot": { "utseende": "uppsagningsbrev", "b": 26, "h": 32, "etikett": "Uppsägning i förtid", "start": "fran-fiende",
           "fart": 75, "intervall": 2600, "slutIntervall": 1100, "botten": { "matare": 20, "text": "Bolaget sa upp – utan rätt" } },
  "dekor": { "figurer": [{ "utseende": "ko", "x": 55, "y": 600 }, …],
             "handelse": { "rorelse": "lyft", "intervall": 7000, "langd": 2600, "vaxla": "ko-sprattel", "ljud": "muu",
                           "raddning": { "text": "Kon räddad!" } },
             "raknare": { "namn": "Kor i hagen", "text": "{kvar} av {totalt}" } },
  "tid": { "sekunder": 45, "etikett": "Håll ut" },
  "matare": { "namn": "Försäkringen", "steg": 100, "visning": "kort" },
  "vinst": ["overlev"], "forlust": ["matare-full"]
}
```

**Tvärtom och vågor (nivå 6, Kolsyretuberna):** här ska spelaren skjuta på de rätta brickorna (fylla tuber med eget
märke) och låta de andra passera. `"effekt": "fyll"` ger en fyllnadsanimation och brickan lämnar uppåt, `raknas` räknar
missade leveranser för stjärnkravet `maxAntal`, och `vagor` lägger till en andra, blandad och snabbare våg. Mätaren
visas som räknaren "Intrång: 0" (`"visning": "antal"`). I förkortad form:

```json
"tema": "ljus",
"stjarnkrav": { "tre": { "maxMisstag": 0, "maxAntal": { "missad": 1 } }, "tva": { "maxMisstag": 1 }, "en": {} },
"invaders": {
  "spelare": { "utseende": "munstycke", "y": 740, "b": 34, "h": 56 },
  "skott": { "lage": "slapp", "intervall": 220, "fart": 900, "utseende": "gasbubbla" },
  "brickor": {
    "typer": {
      "egen": { "figur": "tub-egen", "skaBort": true, "onHit": { "effekt": "fyll", "poang": 10 },
                "onPass": { "poang": -5, "text": "Missad leverans", "raknas": "missad" } },
      "annan": { "figur": "tub-annan", "smalTraff": 3, "onPass": {},
                 "onHit": { "effekt": "skaka", "misstag": true, "matare": 1, "text": "Annans märke! Intrång." } }
    },
    "rader": [[{ "etikett": "Ditt", "typ": "egen" }, { "etikett": "Annans", "typ": "annan" }, …], […]],
    "b": 40, "h": 66, "mellanrum": 14, "startY": 196, "steg": { "x": 4, "ned": 26, "intervall": 95 }, "fastBredd": true, …,
    "vagor": [{ "text": "Andra vågen – titta noga!", "rader": […], "blanda": true, "mellanrum": 10,
                "forskjutning": [0, 25], "steg": { "x": 4, "ned": 26, "intervall": 70 } }]
  },
  "infotext": "Tuberna marscherar in från grossisten. …",
  "matare": { "namn": "Intrång", "steg": 3, "visning": "antal" },
  "vinst": ["alla-klara"], "forlust": ["matare-full"]
}
```

**Styrning:** spelaren drar var som helst på skärmen för att flytta markören i sidled, och släpper för att skjuta.
Rörelsen är relativ, så tummen skymmer inte figuren. Släpp-för-att-skjuta är valt för att varje skott ska vara ett
medvetet val när fel skott kostar. Med `"lage": "auto"` skjuter spelaren i stället hela tiden medan fingret är nere.

**Ljud:** skott, träff, fångst, misstag och vinst spelas med Web Audio. Ljudet slås av och på med högtalarknappen på kartan.

### Hybridnivåer

En hybridnivå kombinerar slangbellan med en formation som marscherar nedåt, som i invaders. Formationen går inte att
skjuta på: spelaren ska hinna före. Koden återanvänder delarna från de andra mekanikerna:
`slingshot/launcher.ts` (kastet), `common/formation.ts` (rörelsen), `slingshot/course.ts` (banans objekt) och
`common/startPanel.ts` (Starta-rutan) och `hybrid/obstacles.ts` (skyltar som stoppar kastet). Mall:
`src/levels/_mall-hybrid.json`. Nivå 3 (Travstallet) ser ut så här i förkortad form:

```json
"mekanik": "hybrid",
"stjarnkrav": { "tre": { "maxForsok": 1, "maxFallor": 0 }, "tva": { "maxFallor": 0 }, "en": {} },
"objekt": [
  { "typ": "dekor", "utseende": "stall", "x": 97, "y": 520, "b": 166, "h": 125 },
  { "typ": "dekor", "utseende": "stall-streckat", "x": 300, "y": 520, "b": 150, "h": 122 },
  { "typ": "text", "x": 97, "y": 540, "text": "Tränarens stall", "farg": "morkgron" },
  { "typ": "utslag", "x": 96, "y": 686 }
],
"hybrid": {
  "kast": { "maxDrag": 105, "kraft": 0.11, "friktion": { "luft": 0.012, "mark": 0.09 }, "flygtid": { "min": 22, "max": 50 },
            "vind": { "x": 0.03, "y": 0, "etikett": "Vind", "variation": { "min": 0.01, "max": 0.05, "motsattChans": 0.5 },
                      "plats": { "x": 214, "y": 676 } },
            "siktlinje": 0.5, "spelplan": { "x": 0, "y": 90, "b": 390, "h": 680 } },
  "projektiler": [
    { "id": "avtal", "knapp": "Kasta avtal", "utseende": "avtal", "roll": "falla", "forstaText": "Avtalet räcker inte mot borgenärer" },
    { "id": "hast", "knapp": "Kasta hästen", "utseende": "hastsko", "namn": "Kelly Sig", "roll": "vinnare",
      "aterkomst": { "vantaMs": 2000, "till": { "x": 97, "y": 505 } } }
  ],
  "startval": "hast",
  "mal": { "x": 265, "y": 459, "b": 70, "h": 56 },
  "studsyta": { "x": 225, "y": 398, "b": 150, "h": 124 },
  "vinstText": "Tradition!",
  "fiender": { "utseende": "portfolj", "rader": [[{ "etikett": "Kronofogden" }, …], …], "b": 120, "h": 52,
               "mellanrum": 6, "forskjutning": [0, 60], "startY": 96, "steg": { "x": 5, "ned": 15, "intervall": 230 },
               "kant": { "vanster": 16, "hoger": 374 } },
  "faraY": 395,
  "hud": { "rubrik": "Borgenärer", "varde": "{antal} i kö" },
  "hinder": [{ "etikett": "Kvarstad", "x": 150, "y": 600, "b": 84, "h": 26, "tillX": 290, "fart": 70,
               "text": "Kvarstad! Hästen hölls kvar." }]
},
"forlust": { "rubrik": "Utmätt.", "orsaker": { "botten": "Hästen stod kvar hos säljaren. Ditt avtal hjälpte inte." } }
```

| Fält i `hybrid` | Vad det gör |
|---|---|
| `kast` | Kastfysiken, samma fält som i `slangbella` (utom antal, projektil och HUD). `vind` är valfri; med `variation` slumpas den inför varje kast, och indikatorn står vid `vind.plats`. |
| `projektiler` | En knapp per projektil längst ner. `roll: "vinnare"` vinner om den stannar i `mal`. Missar den ligger den kvar `aterkomst.vantaMs` ms, galopperar till `aterkomst.till` och laddas igen. `roll: "falla"` studsar alltid bort från `studsyta`, räknas i `maxFallor` och visar `forstaText` första gången. `namn` står under slangbellan. |
| `startval` | `id` på den projektil som är vald från början. |
| `mal` | Rektangel (`x`, `y` = övre vänstra hörnet). En vinnare som stannar här vinner. |
| `studsyta` | Rektangel som fällor studsar mot. Utelämnas den används `mal`. |
| `vinstText` | Text som tonar in och blinkar en gång ovanför studsytan vid vinst. |
| `fiender` | Formationen: samma fält som invaders-brickor (`rader`, `b`, `h`, `mellanrum`, `forskjutning`, `startY`, `steg`, `kant`) plus `utseende` (figur i art.ts). Fiender har bara `etikett`. |
| `faraY` | Når formationens underkant hit innan man vunnit är nivån förlorad (orsak `botten`). Pågår ett kast får det landa först. |
| `hud` | Rutan uppe till höger. `{antal}` byts mot antalet fiender. |
| `hinder` | Valfritt. Skyltar (`etikett`, mittpunkt `x`/`y`, `b`, `h`) som pendlar mellan `x` och `tillX` med `fart` punkter per sekund. Det som kastas och träffar en skylt i luften faller ner där (en miss). `text` visas första gången. |

Tiden till förlust styrs av `startY`, `steg` och `faraY`. Med värdena ovan tar det cirka 22 sekunder.

## Platshållartext

Text inom hakparenteser, till exempel `[FYLLS I AV MÅLANSVARIG]`, räknas som platshållare. Den visas i vinrött på domslutet
och ger en varning i webbläsarens konsol när spelet startar. Kontrollera alla nivåfiler med:

```bash
npm run kolla-platshallare
```

Kontrollen körs också automatiskt vid varje `npm run build` (även i GitHub Pages-bygget) och skriver då ut varningar.
Med `node scripts/kolla-platshallare.mjs --strikt` avslutas den med fel om något hittas. Använd det inför App Store.

## Platshållare

- **Nivå 7–10** är platshållare (bara `id`, `nummer`, `titel`, `referens`, `mekanik`, `fylgiaMal`, ev. `etikett`). De syns låsta på kartan.
- **Typsnitt**: Newsreader och Instrument Sans från Google Fonts. Byts mot ABC Arizona i `src/config/theme.ts` + `index.html`.
- **Logotyp**: den riktiga, extraherad som vektor ur KAN:s varumärkesmanual (2026-11-16). Filerna är vita och färgas i spelet (`src/ui/Logo.ts`).
- **Spelvärden** för nivå 1 (kraft, vind, skadestånd 25 000 kr, mätaren −50 per bilträff) behöver provspelas. Slicen slumpas mellan 0,03 och 0,075 per slag (var fjärde åt andra hållet), siktlinjen visar 40 % av banan och bilen står strax ovanför green.
- **Domslutstexterna** `domslut.text` och `utfall` för nivå 1 har jag skrivit själv. De bör granskas.
- **Capacitor** är installerat och konfigurerat (`capacitor.config.ts`), men det finns ingen iOS-plattform. När det är dags: `npm run build && npx cap add ios`.
