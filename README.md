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

- `npm run build`: platshållarkontroll, typkontroll, produktionsbygge till `dist/` och en kontroll av att bygget saknar testläge
- `npm run preview`: kör det byggda spelet lokalt
- `npm run typecheck`: bara typkontroll

Rensa sparade framsteg: kör `localStorage.removeItem('forefallet.framsteg.v1')` i webbläsarens konsol, eller använd testläget.

## Testläge

Lägg till `?debug=1` i adressen, t.ex. `http://localhost:5173/?debug=1` eller
`https://jesperlinder.github.io/Fore-Fallet/?debug=1`. Då gäller följande:

- Alla nivåer är upplåsta, och "TESTLÄGE" står under logotypen på kartan.
- Längst ner i varje nivå finns knapparna **Vinst 3★**, **Vinst 1★** och **Förlust**. I nivå 5 heter de
  **Halvvägsvinst 3★/1★**. Vinsterna sparas som vanliga resultat (3★ ger också guldstjärnan där den finns) och visar domslutet.
  Förlust visar nivåns förlustskärm.
- Under listan på kartan finns knappen **Nollställ framsteg**.

Testläget styrs av en byggvariabel och finns bara i:

- utvecklingsläget (`npm run dev`)
- bygget för webbtest, `VITE_TESTLAGE=1` (GitHub Pages-arbetsflödet sätter den)

Vanliga `npm run build`, som används för appen, tar bort all testkod (`src/debug/`). Sist i bygget kontrollerar
`scripts/kolla-bygge.mjs` att ingen testkod följt med; annars avbryts bygget.

## Skärmdumpsläge

Lägg till `?screenshot=1` i adressen. Då gäller följande:

- Inga testknappar syns.
- Framstegen är påhittade och finns bara i minnet: alla tio nivåer är klarade, de flesta med tre stjärnor.
  Dina riktiga sparade framsteg rörs inte. Kartan och säsongsskärmen ser därför färdigspelade ut.
- Med `&niva=1`, `2`, `5`, `8` eller `10` startar nivån direkt, spelas några sekunder av sig själv och fryses
  i ett snyggt läge. I konsolen står `SKÄRMDUMPSLÄGE: fryst` när bilden är klar. Exempel:
  `http://localhost:5173/?screenshot=1&niva=8`.
- Vill du frysa vid ett annat ögonblick, lägg till `&frys=…`. I nivå 1, 8 och 10 är det antal bildrutor efter
  sista skottet (standard 27, 22 och 54); i nivå 2 och 5 millisekunder spelad tid efter "Starta" (standard 2600 och 6000).

Skärmdumpsläget finns, precis som testläget, bara i utvecklingsläget och i webbtestbygget (GitHub Pages).
Appbygget (`npm run build`) saknar det, och `scripts/kolla-bygge.mjs` kontrollerar det.

**Skärmdumpar i App Store-storlek.** Apple kräver bilder för den största iPhone-skärmen (6,9 tum,
1320 × 2868 pixlar). Färdiga bilder från de fem nivåerna ligger i `store/skarmdumpar/`. Ta nya så här i Chrome:

1. Öppna till exempel `http://localhost:5173/?screenshot=1&niva=1`.
2. Öppna utvecklarverktygen (Cmd+Alt+I) och slå på enhetsläget (Cmd+Shift+M).
3. Välj **Dimensions: Edit…** och lägg till en enhet med bredd 440, höjd 956 och **Device pixel ratio** 3.
4. Ladda om sidan och vänta tills `SKÄRMDUMPSLÄGE: fryst` står i konsolen.
5. Öppna menyn med tre punkter i enhetsfältet och välj **Capture screenshot**. Bilden blir 1320 × 2868.

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

## Bygga för iOS

iOS-projektet ligger i `ios/` (Capacitor 8). App-id: `se.fylgia.forefallet`, visningsnamn "Före fallet",
bara porträttläge, bara iPhone (på iPad körs den som iPhone-app), statusraden dold. Det enda som behövs i
Xcode är att välja vem som signerar appen. Här är hela vägen från kod till TestFlight, steg för steg.

### Det här behöver du först (en gång)

1. **En Mac** med den senaste versionen av macOS. iOS-appar kan bara byggas på en Mac.
2. **Xcode**: installera det gratis från App Store på Macen (sök på "Xcode"; det är stort och tar en stund).
   Öppna det en gång efter installationen och godkänn villkoren. Väljer Xcode att installera "iOS"-komponenter, gör det.
3. **Node.js** version 20 eller senare: ladda ner "LTS" från nodejs.org och installera.
4. **Ett konto i Apple Developer Program** för Fylgia (se "Det du måste göra själv" nedan). Ditt Apple-ID
   måste vara med i Fylgias team där.
5. **Logga in i Xcode**: menyn **Xcode → Settings… → Accounts**, tryck **+** längst ner till vänster,
   välj **Apple ID** och logga in. Fylgias team ska nu synas i listan.
6. **Hämta koden** och installera beroendena. Öppna programmet Terminal och skriv:

```bash
git clone https://github.com/jesperlinder/Fore-Fallet.git
```

```bash
cd Fore-Fallet
```

```bash
npm install
```

### Bygga och ladda upp (varje gång)

Alla kommandon körs i Terminal, i mappen `Fore-Fallet`.

**1. Bygg spelet.** Det gör ett produktionsbygge utan testläge och skärmdumpsläge:

```bash
npm run build
```

Det ska sluta med raden "Byggkontroll: produktionsbygget saknar testläge och skärmdumpsläge."

**2. Kopiera bygget till iOS-projektet:**

```bash
npx cap sync ios
```

**3. Öppna projektet i Xcode:**

```bash
npx cap open ios
```

Första gången hämtar Xcode Capacitors paket. Vänta tills det står "Ready" högst upp i fönstret.

**4. Välj team för signering** (bara första gången på en ny Mac):

1. Klicka på den blå ikonen **App** högst upp i listan till vänster.
2. I mitten: välj **App** under **TARGETS**, och sedan fliken **Signing & Capabilities**.
3. Kryssa i **Automatically manage signing**.
4. Välj Fylgias team i listan **Team**. **Bundle Identifier** ska vara `se.fylgia.forefallet`.
   Får du ett rött felmeddelande om att id:t inte är tillgängligt: kontrollera att du valt rätt team.

**5. Höj byggnumret.** Varje uppladdning måste ha ett nytt byggnummer. I samma vy, fliken **General**:
öka **Build** med ett (1, 2, 3 …). **Version** (just nu 0.1.0) ändrar du bara när en ny version ska ut i App Store.

**6. (Frivilligt) Prova på din egen iPhone.** Koppla in telefonen med sladd och lås upp den. Välj den i
listan högst upp i mitten av Xcode-fönstret och tryck på ▶ (Run). Första gången måste du slå på
**Utvecklarläge** i telefonen (Inställningar → Integritet och säkerhet → Utvecklarläge) och starta om den.

**7. Arkivera.** Välj **Any iOS Device (arm64)** i listan högst upp i mitten. Välj sedan menyn
**Product → Archive**. Det tar någon minut. När det är klart öppnas fönstret **Organizer** med arkivet överst.

**8. Ladda upp till App Store Connect.** I Organizer: markera arkivet och tryck **Distribute App**.
Välj **App Store Connect** och sedan **Upload** (eller **Distribute**). Behåll förvalen och tryck vidare tills
uppladdningen startar. Kräver Xcode att appen först skapas i App Store Connect, gör det enligt steg 3 i
"Det du måste göra själv" nedan och försök igen.

**9. Vänta på bearbetningen.** Logga in på appstoreconnect.apple.com, öppna **Appar → Före fallet → TestFlight**.
Bygget syns där efter 5–30 minuter, och du får ett mejl när det är klart. Frågan om kryptering är redan
besvarad i appen (`ITSAppUsesNonExemptEncryption` = nej), så bygget blir testbart direkt.

**10. Lägg till testare i TestFlight.**

- **Interna testare** (personer i Fylgias team i App Store Connect, högst 100): fliken **TestFlight**,
  **Intern testning** i vänsterspalten, tryck **+**, ge gruppen ett namn och lägg till personerna. De får ett mejl direkt.
- **Externa testare** (vem som helst, med e-postadress eller en öppen länk): **Extern testning**, tryck **+**,
  skapa en grupp, lägg till bygget och fyll i **Testinformation** (vad som ska testas och en e-postadress för
  synpunkter). Första bygget granskas av Apple, oftast inom ett dygn.
- Testarna installerar appen **TestFlight** från App Store och öppnar inbjudan i den.

**När spelet ändras:** gör om steg 1–3, 5, 7 och 8. Steg 4 behövs bara en gång per Mac.

### Det du måste göra själv (i den här ordningen)

1. **Gå med i Apple Developer Program som organisation** (developer.apple.com/programs/enroll, 99 USD per år).
   Det kräver ett **D-U-N-S-nummer** för Advokatfirman Fylgia (gratis, men kan ta upp till ett par veckor att få)
   och att den som ansöker får teckna avtal för firman.
2. **Bjud in de som ska bygga och testa** i App Store Connect under **Användare och åtkomst**.
3. **Skapa appen i App Store Connect**: **Appar → + → Ny app**. Plattform iOS, namn "Före fallet",
   primärt språk svenska, paket-id `se.fylgia.forefallet`, SKU till exempel `forefallet`. Finns inte paket-id:t
   i listan: registrera det under **Certificates, Identifiers & Profiles → Identifiers** på developer.apple.com,
   eller bygg en gång i Xcode med Fylgias team valt (då registreras det automatiskt).
4. **Byt ut `[KONTAKT-E-POST]`** i `public/integritet.html` och pusha till `main`, så att policyn publiceras.
5. **Bygg och ladda upp** enligt stegen ovan, och **bjud in interna testare** i TestFlight.
6. **För externa testare**: fyll i testinformationen (beskrivning, e-post för synpunkter, kontaktuppgifter
   för Apples granskning) och vänta på Apples betagranskning.
7. **Inför App Store** (behövs inte för TestFlight): under **Appinformation** kategori, åldersgräns
   (frågeformuläret), integritetspolicyns adress och **Supportadress** (krävs; en sida där man kan nå er).
   Under **Appens integritet**: välj "Data samlas inte in". **Status som näringsidkare** (EU:s DSA) måste anges
   för att appen ska finnas i EU; som företag syns då Fylgias adress, telefon och e-post i App Store.
   Pris (gratis), länder, upphovsrätt, texterna i `store/beskrivning.md` och skärmdumparna i `store/skarmdumpar/`.

### Ikon och startbild

Källbilderna ligger i `assets/` och skapas av `scripts/skapa-ikoner.mjs`: mörkgrön bakgrund (#0F2827) med
Fylgias lila fyruddiga stjärna, ingen text och ingen genomskinlighet. Alla storlekar i Xcode-projektet
genereras med @capacitor/assets. Har något ändrats, kör:

```bash
npm run ikoner
```

```bash
npx cap sync ios
```

### Inställningar i iOS-projektet

- `ios/App/App/Info.plist`: visningsnamn, bara porträtt (`UISupportedInterfaceOrientations`), dold statusrad
  (`UIStatusBarHidden`), ingen kryptering att deklarera (`ITSAppUsesNonExemptEncryption`), språk svenska.
- `ios/App/App.xcodeproj`: app-id, version (`MARKETING_VERSION`) och byggnummer (`CURRENT_PROJECT_VERSION`),
  bara iPhone (`TARGETED_DEVICE_FAMILY = 1`), lägsta iOS-version 15.
- `capacitor.config.ts`: app-id, namn och mörkgrön bakgrund bakom webbvyn (ingen vit blinkning vid start).
- **Externa länkar** (lagen.nu, domstol.se, karriärsidan) är vanliga länkar med `target="_blank"`. I appen
  lämnar Capacitor över dem till systemet, så att de öppnas i Safari och inte inne i appen.

## App Store-materialet

I mappen `store/`:

- `beskrivning.md`: namn, underrubrik, sökord och beskrivning, klara att klistra in. Kontrollera längderna med
  `npm run kolla-store`.
- `skarmdumpar/`: fem skärmdumpar i 1320 × 2868 (iPhone 6,9 tum) från nivå 1, 2, 5, 8 och 10.

## Integritet

Spelet samlar inte in några personuppgifter och har ingen spårning, analys eller reklam. Lägg inte till något
sådant: då måste integritetsuppgifterna i App Store Connect och integritetspolicyn ändras.
Integritetspolicyn (svenska och engelska) ligger i `public/integritet.html` och publiceras med spelet på
**https://jesperlinder.github.io/Fore-Fallet/integritet.html**. Den adressen anges i App Store Connect och
länkas från "Om spelet" (`lankar.integritet` i `src/config/links.ts`). Byt ut `[KONTAKT-E-POST]` mot en riktig
adress innan appen skickas in; platshållarkontrollen påminner om det.

## Struktur

```
src/
  main.ts                 startar Phaser och registrerar scenerna
  config/theme.ts         färger, typsnitt, avstånd, radier
  config/strings.ts       alla gemensamma texter (svenska)
  config/display.ts       logisk upplösning och pixeltäthet
  core/levelTypes.ts      nivåformatet (TypeScript-typer, dokumenterade)
  core/levels.ts          läser in src/levels/*.json, upplåsning
  core/progress.ts        sparar stjärnor och ljudval (ENDA stället som rör lagringen: Preferences i appen, localStorage på webben)
  core/sound.ts           all ljud: effekter och musik med Web Audio (inga ljudfiler), huvudvolym, upplåsning på iOS
  core/scoring.ts         poäng → stjärnor
  scenes/                 Boot, Title, Map, Level, Verdict, Season, About (Om spelet), Congrats (Grattis) + BaseScene
  mechanics/              Slingshot.ts, Invaders.ts, Hybrid.ts, registry.ts, art.ts (figurer)
  mechanics/slingshot/    kastaren (launcher.ts: slangbella, sikte, flygning), flygmodell, bana, resultatrad
  mechanics/invaders/     brickornas rutnät, fallande objekt, HUD (tid, inforuta, mätare)
  mechanics/hybrid/       hybridens HUD: borgenärsrutan, valknappar, hur fiender ritas
  mechanics/common/       delat: formation.ts (marscherande rutnät), startPanel.ts (Starta-rutan)
  levels/                 en JSON-fil per nivå
  ui/                     knappar, text, stjärnor, paneler, märken, scroll
  debug/                  testläget (?debug=1) och skärmdumpsläget (?screenshot=1), finns bara i utvecklings-/webbtestbygget
  platform/haptics.ts     lätt vibration vid träff och misstag (Capacitor Haptics)
  platform/openLink.ts    öppnar externa länkar (telefonens webbläsare i appen, ny flik på webben)
public/fonts/             typsnitten (woff2) med licenser (OFL-*.txt) och typsnitt.css
public/assets/            Fylgias logotyp och symbol (SVG ur varumärkesmanualen)
public/icon.svg           favicon för webben, icon-1024.png samma i 1024×1024 (hemskärmsikon på webben)
public/integritet.html    integritetspolicyn (svenska och engelska)
assets/                   källbilder för appikonen och startbilden (skapas av scripts/skapa-ikoner.mjs)
ios/                      Xcode-projektet (Capacitor). ios/App/App/public kopieras från dist/ av cap sync
store/                    App Store-texter och skärmdumpar
scripts/                  kontroller (platshållare, bygget, store-texter) och ikongeneratorn
```

## Skärmarna

- **Startskärmen** (`TitleScene`) har två knappar:
  - **Spela**: en ny spelare utan sparade resultat går direkt till nivå 1, andra till kartan.
  - **Om spelet**.

  Den lila stjärnan roterar ett varv på 20 sekunder.
- **Om spelet** (`AboutScene`) visar:
  - spelets text och källor;
  - länken "Integritetspolicy" (`lankar.integritet`);
  - "Nollställ framsteg" med en bekräftelsefråga;
  - versionsnumret, som hämtas från `package.json` vid bygget (`__VERSION__` i `vite.config.ts`).
- **Säsongen klar** (`SeasonScene`, efter domslutet i nivå 10) har två knappar:
  - **Dela resultat**, som delar länken `lankar.dela`;
  - **Fortsätt**, som leder till grattisskärmen första gången hela spelet är klarat och annars till kartan.
- **Grattis** (`CongratsScene`) visas när alla tio nivåer har minst en stjärna (halvvägsvinst räknas).
  - Den kan också nås från kartan via knappen "Du klarade hela spelet" under listan.
  - Stjärnan skalas upp från noll, och 36 guldkonfettibitar faller en gång.
  - "Sök jobb hos Fylgia" öppnar `lankar.sokJobb` i telefonens webbläsare.
- Alla länkar finns i `src/config/links.ts`.

## Gemensamt gränssnitt i nivåerna

- **Sidhuvud**: nivåetikett, titel och pausknapp ritas av `LevelScene` och står på samma plats i alla nivåer.
- **Mätarkortet** uppe till höger (klocka, räknare, "Borgenärer", "Plenum" …) kommer från `src/ui/HeaderCard.ts`.
  Kortet är mörkgrönt med grön kontur, så att guld, lila och ljusbeige text klarar kontrastkravet 4.5:1 på alla banor.
  Om kortet skulle täcka nivåetiketten flyttar det ner under den och blir kompakt.
- **Kontrast**: all text ska ha minst 4.5:1 mot bakgrunden. Guld (#BA8500) används aldrig som text på ljus bakgrund;
  använd mörk ockra (#6B4E04) där. Mot lila bakgrund används mörkgrönt.
- **Paus**: pausknappen ger "Fortsätt", "Börja om" och "Till kartan". När appen går i bakgrunden eller skärmen släcks
  (`visibilitychange`) pausas spelet och visar pausmenyn. Det fortsätter först när spelaren trycker "Fortsätt".
- **Säkra marginaler**: `#ram` i `index.html` lägger `env(safe-area-inset-*)` runt spelytan, så att inget hamnar under
  kameraurtaget eller hemindikatorn. Marginalerna får scenens färg (överst banans översta lager, nederst det understa).
- **Haptik**: lätt vibration vid träff och misstag (`src/platform/haptics.ts`, Capacitor Haptics). Ljudknappen styr
  båda: ljud av betyder också vibration av. På webben används `navigator.vibrate` där det finns, annars händer inget.
- **Scenbyten** tonar ut och in (`bytTill` i `BaseScene`), även "Börja om".

## Ljud

Allt ljud finns i `src/core/sound.ts`, som skapar effekterna och musiken med Web Audio. Det finns inga ljudfiler.

- **Huvudvolym**: `HUVUDVOLYM` (0,8). Efter den sitter en mjuk begränsare, så att många ljud samtidigt inte spräcks.
- **Utjämning**: `UTJAMNING` har en faktor per ljud. Alla effekter ligger inom ±1 dB från samma mål.
  - Skottet ligger 3 dB lägre med flit, eftersom det hörs ofta.
  - Musiken ligger cirka 5 dB under effekterna.
  - Mätt som medelvärdet av K-vägd ljudstyrka (ITU BS.1770) och samma mätning med högpass 180 Hz, som en telefonhögtalare.
  - Måttet är det starkaste 100 ms-fönstret. Mät om ett nytt ljud med `renderaLjud` i en OfflineAudioContext.
- **iOS** spelar bara ljud som startats i ett tryck. `main.ts` låser upp ljudet vid första tryck, direkt i
  webbläsarens händelse, så att det fungerar redan från startskärmens "Spela".
- **Bakgrunden**: när appen går i bakgrunden tystnas ljudet. Det startar igen vid nästa tryck.
- **Ljud av** på kartan stänger av både ljud och vibration.

## Offline

Spelet fungerar helt utan internet: typsnitten ligger i `public/fonts/` och allt annat finns i bygget.
De enda externa adresserna är länkarna som spelaren själv trycker på (domstolsavgörandena och karriärsidan).
På webben (GitHub Pages) måste sidan förstås laddas en gång; appen har allt inbyggt.

## Lagring av framsteg

`src/core/progress.ts` är den enda modulen som läser och skriver framstegen:

- **I appen** används Capacitor Preferences, eftersom iOS kan rensa localStorage i en webbvy.
  - Datan läses in när spelet startar och sparas vid varje ändring.
  - Första gången flyttas eventuella gamla framsteg över från localStorage.
- **På webben** används localStorage som förut (nyckeln `forefallet.framsteg.v1`).

## Prestanda

Uppmätt i Chromium i alla tio nivåer:

| Mätning | Resultat |
|---|---|
| Logik och fysik per bildruta | under 2 ms |
| Ritning per bildruta (JavaScript-delen) | 1–3 ms |
| Med processorn strypt 4 gånger ("äldre telefon") | cirka 4–13 ms, inom 16,7 ms för 60 bilder/s |
| Fysikkroppar | högst 9 (nivå 10) |

- Inga nivåer har partikeleffekter. Den enda är konfettin på grattisskärmen: 36 bilder (en delad textur) som faller en gång och tas bort.
- Skott, fallande objekt, block och kastade föremål tas bort när de lämnar skärmen eller är klara.
- Antalet objekt är stabilt under spel; inga läckor hittades.
- Nivå 2, 5 och 6 ritar mest (cirka 3 ms), nivå 7, 8 och 10 minst (cirka 1 ms).

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
| `slangbella` | antal skott, kraft, friktion, valfri vind/slice (`vind.variation` = slumpad per skott), `siktlinje` (andel av banan som visas, 0–1), spelplan, rubriker i resultatraden (valfria). Med `sidvy` och fysikblock: se "Slangbella med fysikblock" nedan. Mall: `src/levels/_mall-slingshot.json` |
| `invaders` | spelare, skott, brickor, fångstobjekt, skydd, tid, mätare, vinst- och förlustvillkor (se nedan) |
| `hybrid` | kastfysik, projektiler, mål, studsyta, fiender och faragräns (se nedan) |
| `forlust` | rubrik (och valfria orsakstexter) på förlustskärmen |
| `objekt` | `utslag`, `mal` (målyta med poäng), `hinder` (skadestånd, sänker mätaren, kan nollställa stjärnorna), `zon`, `linje`, `etikett`, `dekor` (valfritt `b`/`h`), `text`, och i sidovy `block` (fysikblock) och `plattform` |
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
visas som räknaren INTRÅNG med vinröd siffra (`"visning": "antal"`), och `tipsUnderSpel` visar Fylgia-tipset längst ner
under spelet. Nivån har inga poäng. I förkortad form:

```json
"tema": "ljus",
"stjarnkrav": { "tre": { "maxMisstag": 0, "maxAntal": { "missad": 1 } }, "tva": { "maxMisstag": 1, "maxAntal": { "missad": 3 } },
                "en": { "maxAntal": { "missad": 6 } } },
"invaders": {
  "spelare": { "utseende": "munstycke", "y": 640, "b": 42, "h": 52 },
  "skott": { "lage": "slapp", "intervall": 220, "fart": 900, "utseende": "gasbubbla" },
  "brickor": {
    "typer": {
      "egen": { "figur": "tub-egen", "etikettFarg": "morkgron", "skaBort": true, "onHit": { "effekt": "fyll" },
                "onPass": { "text": "Missad leverans", "raknas": "missad" } },
      "annan": { "figur": "tub-annan", "etikettFarg": "vinrod", "smalTraff": 3, "onPass": {},
                 "onHit": { "effekt": "skaka", "misstag": true, "matare": 1, "text": "Annans märke! Intrång." } }
    },
    "rader": [[{ "etikett": "Ditt", "typ": "egen" }, { "etikett": "Annans", "typ": "annan" }, …], […]],
    "b": 40, "h": 66, "mellanrum": 16, "startY": 196, "steg": { "x": 4, "ned": 26, "intervall": 125 }, "fastBredd": true, …,
    "vagor": [{ "text": "Andra vågen – titta noga!", "rader": […], "blanda": true, "mellanrum": 10,
                "forskjutning": [0, 25], "steg": { "x": 4, "ned": 26, "intervall": 92 } }]
  },
  "infotext": "Tuberna marscherar in från grossisten. …",
  "tipsUnderSpel": true,
  "matare": { "namn": "Intrång", "steg": 3, "visning": "antal" },
  "vinst": ["alla-klara"], "forlust": ["matare-full"]
}
```

**Sköldläge och märkta projektiler (nivå 9, Dubbelstraffet):** med `skold` skjuter spelaren inte; `spelare` blir en
sköld (figuren `"skold"`) som dras i sidled och blockerar allt den träffar. `skyddas` är det som står under skölden.
`skyttar` skjuter projektiler i raka banor mot `skyddas`; varje projektil har en typ (med kategori) och en märkning
(t.ex. vilken deklaration). Regelmotorn (`mechanics/invaders/rules.ts`) håller reda på vilka märkningar som redan
träffats och bedömer varje träff och blockering mot kategorins regel: `"en-per-markning"` (den första träffen per
märkning är rätt, resten ska blockeras), `"slapp-alltid"` eller `"blockera-alltid"`. Fel ger `vidFelBlock` eller
`vidFelSlapp`: steg på mätaren, pratbubbla och valfritt `ledsen` (ms som det skyddade ser ledset ut). Skyttarna finns i
`mechanics/invaders/shooters.ts`; i en salva skjuts projektilerna med en kort lucka så att de går att skilja åt.
`introSteg` visar en förklaring i steg första gången (inte när nivån redan är klarad), och `hornruta` en liten ruta
uppe till höger. I förkortad form:

```json
"invaders": {
  "spelare": { "utseende": "skold", "y": 470, "b": 84, "h": 10 },
  "skold": { "etikett": "NE BIS IN IDEM" },
  "skyddas": { "utseende": "skattskyldig", "ledsen": "skattskyldig-ledsen", "x": 195, "y": 598, "b": 64, "h": 108, "etikett": "Den skattskyldige" },
  "skyttar": {
    "skyttar": [
      { "id": "skatteverket", "etikett": "Skatteverket", "ikon": "dokument", "x": 105, "y": 200, "b": 170, "h": 64,
        "typer": [{ "typ": "skattetillagg", "vikt": 1 }] },
      { "id": "aklagaren", "etikett": "Åklagaren", "ikon": "klubba", "x": 285, "y": 200, "b": 170, "h": 64,
        "typer": [{ "typ": "skattebrott", "vikt": 0.65 }, { "typ": "bokforingsbrott", "vikt": 0.35 }] }
    ],
    "typer": {
      "skattetillagg": { "etikett": "Skattetillägg", "farg": "guld", "kategori": "sanktion" },
      "skattebrott": { "etikett": "Skattebrott", "farg": "vinrod", "kategori": "sanktion" },
      "bokforingsbrott": { "etikett": "Bokföringsbrott", "farg": "vinrod", "streckad": true, "kategori": "fri" }
    },
    "markningar": ["A", "B", "C"],
    "kategorier": {
      "sanktion": { "regel": "en-per-markning",
                    "vidFelBlock": { "matare": 10, "text": "Ett straff får man faktiskt få" },
                    "vidFelSlapp": { "matare": 20, "text": "Dubbelbestraffning!", "ledsen": 2000 } },
      "fri": { "regel": "slapp-alltid", "vidFelBlock": { "matare": 20, "text": "Bokföringsbrott är en annan sak" } }
    },
    "fart": 160, "intervall": 1900, "slutIntervall": 900, "fordrojning": 1200,
    "samtidigt": [{ "fran": 0.55, "antal": 2 }, { "fran": 0.85, "antal": 3 }],
    "mal": { "x": 195, "y": 578, "spridning": 22 },
    "flikar": { "x": 300, "y": 548, "prefix": "Dekl.", "rubrik": "Deklarationer" }
  },
  "hornruta": { "rubrik": "Plenum", "text": "Alla justitieråd" },
  "introSteg": ["En sanktion per deklaration får gå igenom.", "Den andra blockerar du.", "Bokföringsbrott släpper du alltid igenom."],
  "brickor": { "typer": {}, "rader": [], …},
  "tid": { "sekunder": 50, "etikett": "Kvar" },
  "matare": { "namn": "Rättssäkerhet", "steg": 100, "visning": "kort" },
  "vinst": ["overlev"], "forlust": ["matare-full"]
}
```

**Styrning:** spelaren drar var som helst på skärmen för att flytta markören i sidled, och släpper för att skjuta.
Rörelsen är relativ, så tummen skymmer inte figuren. Släpp-för-att-skjuta är valt för att varje skott ska vara ett
medvetet val när fel skott kostar. Med `"lage": "auto"` skjuter spelaren i stället hela tiden medan fingret är nere.

**Ljud:** skott, träff, fångst, misstag och vinst spelas med Web Audio. Ljudet slås av och på med högtalarknappen på kartan.

### Slangbella med fysikblock (sidovy)

Nivå 1 ses uppifrån. Med `slangbella.sidvy` ses banan i stället från sidan, med riktig gravitation: projektilen är en
vanlig Matter-kropp som studsar mot marken, och objekt av typen `block` är fysikblock som kan staplas, välta och
falla. Koden finns i `mechanics/slingshot/blocks.ts`; kastet och siktlinjen (med gravitationen inräknad) i
`slingshot/launcher.ts` och `slingshot/flight.ts`. Utan `sidvy` fungerar slangbellan exakt som förut.

- **Stillhet vid start:** blocken sover tills projektilen träffar ett block. Då väcks alla, så att inget svävar kvar.
- **Nedslaget:** ett block räknas som nedslaget när dess mittpunkt hamnat under `nedLinje`, lämnat sin `plattform`
  (utanför dess bredd eller under dess överkant) eller åkt utanför skärmen.
- **Vinst:** `vinst` är en lista där alla villkor måste gälla: `"alla-block"` (alla block med `mal: true`) och/eller
  `"block:<id>"` (ett visst block). Efter varje skott vinner man så fort villkoren gäller; annars väntar spelet tills
  blocken legat stilla en stund. Tar skotten slut innan är nivån förlorad (orsak `skott-slut`).
- **Stjärnor:** `stjarnkrav` med `maxForsok` (använda skott) och `minAntal`/`maxAntal` (block med `raknas`).
- **Papper:** `papper: true` ger högt luftmotstånd, lätt rotation och sidodrift när blocket faller, och prassel vid träff.
  `landningsljud: "klonk"` spelas när ett nedslaget block slår i marken eller en plattform.

Nivå 7 (Elräkningen) i förkortad form:

```json
"tema": "mork",
"stjarnkrav": { "tre": { "maxForsok": 1, "minAntal": { "matare": 1 } }, "tva": { "maxForsok": 2 }, "en": {} },
"bana": { "lager": [{ "farg": "morkgron", "topp": 0 }, { "farg": "gron", "topp": 668 }] },
"slangbella": {
  "antal": 3, "projektil": "ansvarsstjarna", "projektilNamn": "Ansvarsstjärnan",
  "maxDrag": 105, "kraft": 0.1, "friktion": { "luft": 0.004, "mark": 0.09 }, "flygtid": { "min": 22, "max": 50 },
  "siktlinje": 0.45, "spelplan": { "x": 0, "y": 90, "b": 390, "h": 754 },
  "sidvy": { "gravitation": 1, "mark": 668, "radie": 11, "vikt": 0.011 },
  "raknare": { "rubrik": "Efterdebitering", "text": "{kvar} år" },
  "infotext": "Elbolaget har fakturerat för lite i flera år. …",
  "tipsUnderSpel": true,
  "vinst": ["alla-block"],
  "nedLinje": 640
},
"objekt": [
  { "typ": "utslag", "x": 96, "y": 640 },
  { "typ": "plattform", "id": "disk", "x": 296, "y": 646, "b": 84, "h": 44, "farg": "gron", "etikett": "FAKTURA ÅR 1–4" },
  { "typ": "block", "x": 296, "y": 600, "b": 110, "h": 48, "vikt": 0.00015, "utseende": "faktura", "etikett": "År 1",
    "mal": true, "papper": true, "plattform": "disk", "nedText": "År 1: borta" },
  …,
  { "typ": "block", "id": "elmatare", "x": 296, "y": 445, "b": 28, "h": 34, "vikt": 0.0015, "utseende": "elmatare",
    "raknas": "matare", "plattform": "disk", "landningsljud": "klonk", "nedText": "Mätaren var deras ansvar" }
],
"forlust": { "rubrik": "Betala.", "orsaker": { "skott-slut": "Hela efterdebiteringen landade hos dig." } }
```

| Fält | Vad det gör |
|---|---|
| `sidvy` | `gravitation` (1 = jordlik), `mark` (markens överkant, y; en fast markkropp ligger under), valfritt `radie` och `vikt` (täthet) för projektilen. Siktlinjen räknar med gravitationen. |
| `block` (objekt) | Mittpunkt `x`/`y`, `b`, `h`, `vikt` (täthet: papper ca 0.00015, metall ca 0.0015), `utseende` (art.ts), valfritt `id`, `etikett`, `mal`, `raknas`, `nedText`, `papper`, `landningsljud`, `plattform`. Blocken ska ligga exakt på varandra (y = underliggandes överkant − h/2). |
| `plattform` (objekt) | Fast plattform med `id`, mittpunkt `x`/`y`, `b`, `h`, `farg` och valfri `etikett` under. |
| `raknare` | Rutan uppe till höger; `{kvar}` = block med `mal` som står kvar. |
| `infotext`, `tipsUnderSpel` | Uppdraget i en ruta under rubriken, och bara tipset (kort ruta) längst ner. |
| `statisk`, `studs`, `gupp` (block) | Fast block, studs (0–1) och flytande gupp (`hojd`, `period`). Se bossnivån nedan. |
| `projektilNamn` | Text under slangbellan. Utan resultatrad (`hud`) visas kvarvarande skott som små projektiler bredvid slangbellan. |

### Bossnivå och bogserläget (nivå 8, Flytdockan)

Bossnivån bygger på slangbellan i sidovy med fysikblock. Bossen är ett fast block (`statisk`) som studsar tillbaka
allt (`studs`) och guppar på vattnet (`gupp`). Nytt, och återanvändbart:

- **Argument i tur och ordning:** `projektiler` ger varje skott ett eget utseende och en etikett, och `svar` är
  repliken som blocket `svarFran` säger i en talbubbla när just det skottet träffar det. `slutreplik` kommer efter
  sista skottets svar. Koden finns i `mechanics/slingshot/boss.ts`.
- **Bossmätare:** `bossMatare` (namn, status, blinkText) är alltid full och blinkar till vid varje träff.
- **Bogserläget** (`mechanics/slingshot/tow.ts`): spelaren drar med fingret och fordonet följer. När läget startar
  åker fordonet till kopplingen, blocket `objekt` blir rörligt med massan `massa` (trögt att få igång) och lågt
  luftmotstånd `luft` (svårt att stoppa), och de kopplas med ett elastiskt rep (Matter-constraint). Repet ritas som
  en båge som sträcks ut. Vinst när blocket passerat `grans` (framkanten, eller mitten med `matpunkt: "mitt"`);
  förlust (`tid-slut`) när `tid` sekunder gått. `aktivering`: `"direkt"`, `"knapp"` (knappen finns från start och
  pulserar efter `pulseraEfterSkott` skott) eller `"efter-skott"`.
- **Stjärnor:** `maxForsok` räknar använda skott, så `{ "maxForsok": 0 }` = vann utan att kasta något.
- **Övrigt:** `musik: "boss"` (en tung basslinga som blir ljusare i bogserläget; följer ljud av/på), `rubrikmarke`
  (guldmärke i rubriken, t.ex. "BOSS") och `mellanstopp` (svart skärm med en rad text i en sekund innan nivån).
  Låsta nivåer med `etikett` visar den till höger på kartan ("BOSS", "FINAL").

```json
"rubrikmarke": "BOSS", "mellanstopp": "BOSS – NJA 1997 s. 660",
"stjarnkrav": { "tre": { "maxForsok": 0 }, "tva": { "maxForsok": 1 }, "en": {} },
"slangbella": {
  "antal": 3, "projektil": "argument", "svarFran": "docka",
  "projektiler": [{ "etikett": "Köpeavtalet!", "svar": "Ett avtal binder er två. Inte Finnbodas borgenärer." }, …],
  "slutreplik": "Traditionsprincipen överges inte utan stöd av lag.",
  "sidvy": { "gravitation": 1, "mark": 900, "radie": 9, "vikt": 0.004 },
  "bossMatare": { "namn": "Traditionsprincipen", "status": "Fast förankrad", "blinkText": "Oförändrad" },
  "musik": "boss", "tipsUnderSpel": true,
  "bogsera": {
    "aktivering": "knapp", "knapp": { "text": "Bogsera dockan", "pulseraEfterSkott": 3 },
    "fordon": { "utseende": "bogserbat", "b": 56, "h": 30, "start": { "x": 34, "y": 428 }, "koppling": { "x": 310, "y": 470 },
                "fart": 3.2, "y": { "min": 440, "max": 610 } },
    "objekt": "docka", "massa": 1200, "luft": 0.015,
    "rep": { "fast": { "x": 100, "y": 30 }, "langd": 60, "styvhet": 0.02, "dampning": 0.05 },
    "grans": { "x": 330, "y1": 436, "y2": 590, "etikett": "VARVETS GRÄNS" },
    "tid": 30,
    "vinst": { "text": "Tradition! Nu är den din.", "utseenden": ["flytdocka-forvanad", "flytdocka-nojd"] }
  }
},
"objekt": [
  { "typ": "utslag", "x": 80, "y": 580 },
  { "typ": "block", "id": "docka", "x": 150, "y": 395, "b": 200, "h": 120, "vikt": 0.01, "utseende": "flytdocka",
    "statisk": true, "studs": 0.9, "gupp": { "hojd": 3, "period": 2600 } }
]
```

Med massan 1200 tar en rak och bestämd bogsering cirka 11 sekunder av 30.

### Studsmål och scriptade händelser (nivå 10, Fastighetsforum)

Objekt av typen `studsmal` är fasta mål i sidovy (`mechanics/slingshot/targets.ts`). De stöter bort projektilen, säger
`text` i en talbubbla (en gång per kast) och kan med `studs: { "mot": "<id>" }` skicka projektilen i en båge mot ett
annat studsmål i stället för en vanlig studs (`"fysik"`). Ett studsmål med `slut` är ett slutmål: kastet avslutas och
en scriptad händelse tar över. Projektilen får en guldstämpel (`stampel`) och flyger av sig själv i en båge
(`tid` ms, `topp` = bågens kontrollpunkt i y; negativt = högt ovanför skärmen) till målet `till`. Där svarar mottagaren
(`svar`), ett jubelljud spelas och figuren `lys` tonas in. Vinstvillkoret `"slutmal"` gäller när händelsen är klar.
`overrubrikTillagg` lägger till t.ex. "Final" i nivåetiketten. På lila bakgrund blir Fylgia-märket mörkgrönt.

```json
"overrubrikTillagg": "Final",
"stjarnkrav": { "tre": { "maxForsok": 1 }, "tva": { "maxForsok": 2 }, "en": {} },
"bana": { "lager": [{ "farg": "lila", "topp": 0 }, { "farg": "morkgron", "topp": 690 }] },
"slangbella": { "antal": 4, "projektil": "akt", "kraft": 0.16, "sidvy": { "gravitation": 0.6, "mark": 690, "radie": 8 },
                "tipsUnderSpel": true, "vinst": ["slutmal"], "nedLinje": 900, … },
"objekt": [
  { "typ": "studsmal", "id": "hd", "x": 320, "y": 196, "b": 90, "h": 70, "utseende": "hogsta-domstolen", "etikett": "Högsta domstolen",
    "slut": { "stampel": "FASTIGHETSFORUM", "till": "sodertorn", "tid": 2000, "topp": -200, "svar": "Åh. Då är den vår.",
              "lys": { "utseende": "lokal-tand", "x": 350, "y": 665, "b": 60, "h": 50 } } },
  { "typ": "studsmal", "id": "svea", "x": 278, "y": 372, "b": 76, "h": 64, "utseende": "domstol-streckad", "etikett": "Svea hovrätt",
    "text": "Vi håller med tingsrätten. Prova Stockholms tingsrätt.", "studs": { "mot": "stockholm" } },
  { "typ": "studsmal", "id": "sodertorn", "x": 272, "y": 650, "b": 76, "h": 80, "utseende": "tingsratt", "etikett": "Södertörns tingsrätt",
    "text": "Avvisas! Inte en hyrestvist.", "studs": "fysik" },
  { "typ": "block", "x": 168, "y": 679, "b": 112, "h": 22, "vikt": 0.0008, "utseende": "invandning", "etikett": "Foruminvändning", "etikettFarg": "ljusbeige" },
  …
]
```

Hela scenen ryms på en skärm, så kameran står still under bågen.

### Avslutningsskärmen

Efter domslutet i sista nivån leder knappen "Säsongen klar" till `SeasonScene` (nyckel `Sasong`): stor lila stjärna,
totala stjärnor, alla fall med stjärnor (och guldstjärnor) där upplåsta rader går att spela om, "Dela resultat",
karriärrutan och "Säsong 2 kommer". Länkarna står i `src/config/links.ts`: `dela` (tom = ingen delningsknapp) och
`karriar`. Delningen använder telefonens delningsfunktion (Web Share API) och kopierar annars texten till urklipp.

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
och ger en varning i webbläsarens konsol när spelet startar. Kontrollen går igenom alla nivåfiler, texterna i `src/config/`, HTML-sidorna i `public/` och texterna i `store/`.
Enda tillåtna undantaget är `[KONTAKT-E-POST]` i `public/integritet.html`; för den skrivs bara en påminnelse ut. Kör:

```bash
npm run kolla-platshallare
```

Kontrollen körs också automatiskt vid varje `npm run build` (även i GitHub Pages-bygget) och skriver då ut varningar.
Med `node scripts/kolla-platshallare.mjs --strikt` avslutas den med fel om något hittas. Använd det inför App Store.

## Platshållare

- **Alla tio nivåer är spelbara.** En platshållare (bara `id`, `nummer`, `titel`, `referens`, `mekanik`, `fylgiaMal`, ev. `etikett`) syns låst på kartan; det går att använda för nästa säsongs nivåer.
- **Typsnitt**: Newsreader och Instrument Sans (OFL), lokalt i `public/fonts/`. Byts mot ABC Arizona i `public/fonts/typsnitt.css` + `src/config/theme.ts`.
- **Logotyp**: den riktiga, extraherad som vektor ur KAN:s varumärkesmanual (2026-11-16). Filerna är vita och färgas i spelet (`src/ui/Logo.ts`).
- **Spelvärden** för nivå 1 (kraft, vind, skadestånd 25 000 kr, mätaren −50 per bilträff) behöver provspelas. Slicen slumpas mellan 0,03 och 0,075 per slag (var fjärde åt andra hållet), siktlinjen visar 40 % av banan och bilen står strax ovanför green.
- **Domslutstexterna** `domslut.text` och `utfall` för nivå 1 har jag skrivit själv. De bör granskas.
- **Kontaktadressen** i integritetspolicyn (`public/integritet.html`) är `[KONTAKT-E-POST]`.
