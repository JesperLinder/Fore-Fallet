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

- Alla kapitel och alla spelbara nivåer är upplåsta, och "TESTLÄGE" står under logotypen på kartan.
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
- Framstegen är påhittade och finns bara i minnet: alla tio nivåer i kapitel 1 är klarade, de flesta med tre stjärnor.
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
  core/levels.ts          läser in kapitlen och nivåerna i src/levels/, upplåsning av nivåer och kapitel
  core/progress.ts        sparar stjärnor och ljudval (ENDA stället som rör lagringen: Preferences i appen, localStorage på webben)
  core/sound.ts           all ljud: effekter och musik med Web Audio (inga ljudfiler), huvudvolym, upplåsning på iOS
  core/scoring.ts         poäng → stjärnor
  scenes/                 Boot, Title, Map, Level, Verdict, Season, About (Om spelet), Congrats (Grattis) + BaseScene
  mechanics/              Slingshot.ts, Invaders.ts, Hybrid.ts, registry.ts, art.ts (figurer)
  mechanics/slingshot/    kastaren (launcher.ts: slangbella, sikte, flygning), flygmodell, bana, resultatrad
  mechanics/invaders/     brickornas rutnät, fallande objekt, ström av fångstobjekt, växande mål, kulisser och händelser, HUD
  mechanics/hybrid/       hybridens HUD: borgenärsrutan, valknappar, hur fiender ritas
  mechanics/Memory.ts     memorymekaniken (rutnät, vändning, par, effekterna "dimma" och "blanda", bevismätaren, rivna halvor)
  mechanics/memory/       memoryts HUD (par, drag, felvändningar, tid, mätare, bevismätare, inforuta) och symbolerna (forms.ts)
  mechanics/common/       delat: formation.ts (marscherande rutnät), startPanel.ts (Starta-rutan)
  scenes/ChapterSelect…   kapitelvalet; ChapterDoneScene är "Kapitel klart"
  levels/kapitel-N/       ett kapitel: kapitel.json och en JSON-fil per nivå
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
  - **Spela**: öppnar kapitelvalet, även för en ny spelare. Därifrån kapitlets karta och nivåerna.
  - **Om spelet**.

  Den lila stjärnan roterar ett varv på 20 sekunder.
- **Kapitelvalet** (`ChapterSelectScene`) visar ett kort per kapitel med nummer, titel, undertitel, stjärnor
  ("26,5 / 30") och status: Klart, Pågår eller Låst. Ett tryck öppnar kapitlets karta.
- **Kartan** (`MapScene`) visar ett kapitel i taget, med kapitlets nummer, undertitel och titel överst och en
  bakåtknapp till kapitelvalet. Stjärnräknaren uppe till höger gäller kapitlet.
- **Om spelet** (`AboutScene`) visar:
  - spelets text och källor;
  - länken "Integritetspolicy" (`lankar.integritet`);
  - "Nollställ framsteg" med en bekräftelsefråga;
  - versionsnumret, som hämtas från `package.json` vid bygget (`__VERSION__` i `vite.config.ts`).
- **Säsongen klar** (`SeasonScene`, efter domslutet i kapitlets sista nivå) visar kapitlets nivåer och stjärnor
  och har två knappar:
  - **Dela resultat**, som delar länken `lankar.dela`;
  - **Fortsätt**, som första gången kapitlet är klarat leder till Kapitel klart (och efter det sista kapitlet
    vidare till Grattis), och annars till kapitlets karta.

  Efter det sista spelbara kapitlet står "Säsong N kommer" längst ner.
- **Kapitel klart** (`ChapterDoneScene`): kapitlets stjärna i accentfärgen, kapitlets stjärnor och knappen
  **Till nästa kapitel**. Efter det sista kapitlet heter knappen **Vidare** och leder till Grattis. Kan nås igen
  från kartan via "Du klarade kapitlet".
- **Grattis** (`CongratsScene`) visas när det sista spelbara kapitlet är klarat (alla nivåer minst en stjärna,
  halvvägsvinst räknas).
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
  - Skottet och memoryts "flipp" ligger 3 dB lägre med flit, eftersom de hörs ofta.
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

Framstegen sparas per kapitel (sparformat version 3):

```json
{ "version": 3, "kapitel": { "kapitel-1": { "stjarnor": { "golfbollen": 3 }, "guld": { "de-forsvunna-korna": true }, "klartSett": true } } }
```

Äldre sparningar (version 1 och 2, från tiden före kapitlen) migreras automatiskt första gången spelet startar
(`migrera()` i `src/core/progress.ts`): alla stjärnor och guldstjärnor flyttas till kapitlet där nivån nu ligger,
och "grattisskärmen visad" blir `klartSett` för kapitel 1. Ljudvalet följer med.

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

## Kapitel och nivåer

Nivåerna är indelade i kapitel. Varje kapitel är en egen mapp i `src/levels/`:

```
src/levels/
  kapitel-1/              "Klassikerna", de tio första nivåerna
    kapitel.json          kapitelfilen
    niva-01.json … niva-10.json
  kapitel-2/              "Civilrätten": alla tio nivåer är spelbara
  _mall-*.json            mallar för nya nivåer (läses inte in)
```

`kapitel.json` ser ut så här (se `KapitelFil` i `src/core/levelTypes.ts`):

```json
{
  "id": "kapitel-1",
  "nummer": 1,
  "titel": "Klassikerna",
  "undertitel": "Tio mål i Högsta domstolen",
  "farg": "guld",
  "nivaer": ["golfbollen", "lopsedeln", "travstallet"]
}
```

| Fält | Betydelse |
|---|---|
| `id` | unikt id. Framstegen sparas per kapitel-id, så **byt aldrig id på ett kapitel som spelare redan spelat**. |
| `nummer` | kapitlens ordning i kapitelvalet (1, 2, 3 …) |
| `titel`, `undertitel` | visas i kapitelvalet och överst på kartan ("Kapitel 1 · Tio mål i Högsta domstolen") |
| `farg` | accentfärg, en av profilfärgerna: `morkgron`, `gron`, `beige`, `ljusbeige`, `guld`, `morkockra`, `lila`, `vinrod`. Används för nummercirkeln i kapitelvalet och stjärnan på "Kapitel klart". På en mörk färg (`vinrod`, `morkgron`, `gron`, `morkockra`) skrivs numret ljust, och stjärnan på "Kapitel klart" blir lila (en mörk stjärna syns inte mot den mörkgröna bakgrunden). |
| `nivaer` | nivåernas `id` i spelordning. Nivånumret (1, 2, 3 …) räknas fram härifrån. |

**Upplåsning:** kapitel 1 är alltid öppet. Ett kapitel låses upp när det föregående är klarat, det vill säga alla
dess nivåer har minst en stjärna (halvvägsvinst räknas). Inom ett kapitel låses en nivå upp när den föregående har
minst en stjärna (`STJARNOR_FOR_NASTA` i `src/core/levels.ts`). I testläget (`?debug=1`) är allt upplåst.

**Efter ett kapitel:** sista nivån leder till "Säsongen klar" för kapitlet. Därifrån leder "Fortsätt" första gången till
**Kapitel klart**:

- Efter det sista färdiga kapitlet (inget senare kapitel har alla sina nivåer spelbara, i dag kapitel 2) heter
  knappen "Vidare" och leder till **Grattis** med länken till karriärsidan.
- Efter övriga kapitel (i dag kapitel 1) heter knappen "Till nästa kapitel" och öppnar nästa kapitels karta.

Båda kan nås igen från kapitlets karta, via knappen under listan.

### Kapitel 2: Civilrätten

| Nr | id | Titel | Referens | Rättsområde | Mekanik | Status |
|---|---|---|---|---|---|---|
| 1 | `tvattvattnet` | Tvättvattnet | NJA 1982 s. 386 | Skadestånd | invaders | **spelbar** |
| 2 | `semesterdagarna` | Semesterdagarna | NJA 1992 s. 213 | Skadestånd | invaders | **spelbar** |
| 3 | `husbilen` | Husbilen | NJA 1996 s. 598 | Köprätt | memory | **spelbar** |
| 4 | `oxelhacken` | Oxelhäcken | NJA 1990 s. 71 | Grannerätt | invaders | **spelbar** |
| 5 | `trahuset` | Trähuset | NJA 1985 s. 717 | Avtalsrätt | invaders | **spelbar** |
| 6 | `testamentet` | Det sönderrivna testamentet | NJA 2017 s. 362 | Arvsrätt | memory | **spelbar** |
| 7 | `salmonellan` | Salmonellan i skolköket | NJA 1989 s. 389 | Produktansvar | invaders | **spelbar** |
| 8 | `friskvardskursen` | Friskvårdskursen | NJA 2002 s. 644 | Avtalsrätt | invaders, två faser | **spelbar** |
| 9 | `tva-testamenten` | De två testamentena | NJA 2022 s. 509 | Arvsrätt | memory | **spelbar** |
| 10 | `potatispartiet` | Potatispartiet | NJA 1982 s. 301 | Köprätt | invaders, två faser (boss och final) | **spelbar** |

- Nivåer med `"kommerSnart": true` visas låsta med "Kommer snart" på kartan, **även i testläget**. Ta bort fältet
  (och fyll på nivån) när den byggs.
- Kartan visar `kartmarke` efter titeln: "Memory" (lila) på nivå 3, 6 och 9 och "Boss" (guld) på nivå 10.
- Från kapitel 2 står kapitlet först i nivåns rubrik: "K2 · Nivå 3 · NJA 1996 s. 598". Kapitel 1 ser ut som förut.
- Kartan visar `kartmarke` efter titeln: ett märke, eller flera i en lista, t.ex. "Boss" och "Final" på nivå 10.

### Lägga till ett kapitel

1. Skapa mappen `src/levels/kapitel-N/` (N = nästa nummer).
2. Lägg en `kapitel.json` där med nytt `id` (till exempel `"kapitel-3"`), `nummer`, `titel`, `undertitel`, `farg`
   och `nivaer`.
3. Lägg nivåfilerna i samma mapp (se nedan). Till en början räcker platshållare:
   `{ "id": "nytt-id", "titel": "Titel", "referens": "NJA …", "rattsomrade": "…", "mekanik": "slingshot", "kommerSnart": true }`.
4. Kör `npm run kolla-platshallare`. Den kontrollerar att varje id i `nivaer` har en nivåfil och tvärtom, och
   varnar för platshållarnivåer och text inom hakparenteser.
5. Klart. Kapitelvalet, kartan och skärmarna läser in kapitlet automatiskt; ingen kod behöver ändras.

### Lägga till en nivå i ett kapitel

1. Kopiera en befintlig nivå (t.ex. `src/levels/kapitel-1/niva-01.json`) eller en mall (`src/levels/_mall-*.json`)
   till kapitlets mapp, eller fyll på en av platshållarna där. Filnamnet spelar ingen roll, men håll ordning med
   `niva-01.json`, `niva-02.json` …
2. Ändra `id` (unikt i hela spelet, aldrig samma som en annan nivå), `titel`, `referens`, texterna, `objekt` och `domslut`.
   `nummer` behövs inte; numret kommer från ordningen i `kapitel.json` (står det ett annat nummer i filen varnar spelet i konsolen).
3. Lägg till nivåns `id` på rätt plats i `nivaer` i `kapitel.json` (om den inte redan står där som platshållare).
4. Kör `npm run kolla-platshallare` och prova nivån i testläget (`?debug=1`).

En nivå räknas som spelbar när filen har `objekt` och `domslut` och mekaniken är byggd.
Byt aldrig `id` på en nivå som spelare redan spelat: stjärnorna sparas per nivå-id.

### Nivåformatet i korthet

Se `src/core/levelTypes.ts` för alla fält med kommentarer.

| Fält | Betydelse |
|---|---|
| `id`, `titel`, `referens` | identitet och visning på kartan (`nummer` räknas fram ur `kapitel.json`) |
| `rattsomrade` | valfritt, t.ex. `"Köprätt"`: visas på kartan efter referensen i stället för mekanikens namn |
| `kartmarke` | valfritt märke efter titeln på kartan: `{ "text": "Memory", "farg": "lila" }` |
| `kommerSnart` | `true`: nivån är inte byggd än och visas låst med "Kommer snart", även i testläget |
| `rubrikmarke`, `rubrikmarkeFarg` | valfritt märke efter nivåetiketten i nivåns rubrik, t.ex. `"BOSS"` (guld) eller `"Memory"` med `"lila"` |
| `mekanik` | `"slingshot"`, `"invaders"`, `"hybrid"` eller `"memory"` (`"boss"` är reserverad för Potatispartiet, inte byggd än) |
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
| `faser` | valfritt: faser i följd, där varje fas har egna fält (`mekanik`, `tema`, `bana`, `invaders` …) som ersätter nivåns. Se "Nivåer med faser" nedan. |
| `utanStart` | valfritt: mekaniken startar direkt utan startrutan (t.ex. fas 2, efter `mellanstopp`) |
| `mellanstopp` | valfritt: svart skärm med en rad text i en sekund innan nivån (eller fasen) visas, t.ex. "Två veckor senare…" |
| `domslut` | `rubrik`, `underrubrik` (valfri kursiv rad), `text` (valfri), `domskal` (3 st), `fylgiaruta` (lila ruta, bara Fylgia-mål), `lankTillFallet`, `utfall` per antal stjärnor, och `vunnet`/`inteVunnet` för halvvägsvinst (utan `inteVunnet` visas bara Vunnet-rutan, i full bredd) |

### Nivåer med faser

En nivå kan ha flera faser i följd, t.ex. Friskvårdskursen (kapitel 2, nivå 8): först kursen, sedan fakturan.
Varje fas i `faser` ersätter nivåns fält med sina egna: `mekanik`, `tema`, `bana`, `invaders` (eller `memory`,
`slangbella`, `hybrid`), `uppdragstext`, `fylgiaTips`, `mellanstopp` och `utanStart`. Det som står direkt i nivån
(titel, referens, stjärnkrav, domslut) gäller hela nivån.

- När en fas vinns startar nästa (LevelScene startar om sig själv med nästa fas). Vinsten i sista fasen ger stjärnor
  och domslut, räknat på den fasens resultat.
- Förlust i en fas ger förlustskärmen; "Försök igen" börjar om från fas 1.
- Räknarna från tidigare faser följer med (`arv`) och kan användas senare, t.ex. fakturans rad
  `"perArv": { "raknare": "kurstillfallen", "belopp": 900 }` (kurstillfällen från fas 1 × 900 kr).
- `mellanstopp` på en fas visar en svart skärm med texten innan fasen; `utanStart: true` hoppar över startrutan.

```json
"mekanik": "invaders",
"stjarnkrav": { "tre": { "minAntal": { "besparing": 8 }, "maxAntal": { "studs": 0 } }, "tva": { "minAntal": { "besparing": 6 } }, "en": {} },
"faser": [
  { "invaders": {
      "spelare": { "utseende": "traningsvaska", "y": 740, "b": 80, "h": 44 },
      "strom": { "typer": { "tavla": { "utseende": "kurs-tavla", "b": 90, "h": 62, "etiketter": ["Anatomi", "Kost"], "etikettY": 14,
                                      "onFangst": { "raknas": "kurstillfallen" } }, …,
                           "kuvert": { "utseende": "kuvert", "b": 150, "h": 66, "etiketter": ["Jobberbjudande – fast anställning!"],
                                       "onFangst": { "knapp": "Hoppa av kursen" } } },
                 "vikter": { "hantel": 1, "matta": 1, "tavla": 2 },
                 "planerade": [{ "typ": "kuvert", "vid": 15000, "igenEfter": 4000 }], … },
      "summa": { "namn": "Kurstillfällen", "text": "{varde}", "raknare": "kurstillfallen" },
      "vinst": ["knapp"], "forlust": [] } },
  { "mellanstopp": "Två veckor senare…", "utanStart": true, "tema": "mork", "bana": { "lager": [{ "farg": "morkgron", "topp": 0 }] },
    "invaders": {
      "spelare": { "utseende": "textmarkor", "y": 736, "b": 30, "h": 48 },
      "skott": { "lage": "slapp", "intervall": 200, "fart": 1000 },
      "faktura": { "rubrik": "Faktura – Friskvårdsutbildningen", "summaEtikett": "Summa att betala",
                   "rader": [{ "etikett": "Utnyttjad del", "perArv": { "raknare": "kurstillfallen", "belopp": 900 } },
                             { "etikett": "Arbete som ändå måste utföras", "belopp": 6500 },
                             { "etikett": "Utebliven vinst", "belopp": 12000 }],
                   "x": 195, "y": 226, "b": 342, "h": 252, "studsText": "Avbeställa får du. Gratis är det inte.", "ljud": "prassel" },
      "hot": { "start": "slumpvis-overst", "y": 378, "fart": 95, "intervall": 2200, …,
               "typer": { "plats": { "utseende": "mynt-gron", "b": 36, "h": 36, "etiketter": ["Platsen fylldes av någon annan"],
                                     "vidTraff": { "text": "Avdrag – utbildaren sparade det", "raknas": "besparing", "ljud": "avdrag",
                                                   "avdrag": { "rad": 2, "belopp": 3000 } } }, …,
                          "kostnad": { "utseende": "kostnadspapper", "b": 112, "h": 44, "etiketter": ["Redan utnyttjat", …], "etikettY": 0,
                                       "vidTraff": { "studsa": true, "text": "Det får du betala", "ton": "neutral", "raknas": "studs" } } },
               "antal": { "material": 3, "lunch": 3, "plats": 2, "kostnad": 6 } },
      "tid": { "sekunder": 35, "etikett": "Tid kvar" },
      "vinst": ["overlev"], "forlust": [] } }
]
```

Nytt i invaders för Friskvårdskursen:
- `matare` är valfri: utan mätare ritas ingen, och med `summa` står räknarkortet ensamt under rubriken.
- `strom.planerade`: objekt som släpps vid en bestämd tid (och igen efter `igenEfter` ms om de missas).
- Regeln `knapp` visar en knapp när objektet fångas; med vinstvillkoret `"knapp"` avslutar ett tryck fasen.
- `hot.typer` och `hot.antal`: fallande hot i flera sorter med egna regler (`vidTraff`, `vidBotten`), bland annat
  `studsa` (skottet studsar tillbaka) och `avdrag` (drar av från fakturans rad).
- `faktura`: en boss i form av en faktura (`mechanics/invaders/invoice.ts`) med rader som livsstaplar och
  "Summa att betala" som räknas ner. Summan kan inte gå under golvet (raderna minus alla avdrag i fasen); när golvet
  nås lyser summan guld. Skott som träffar fakturan studsar, och `studsText` visas första gången.

### Tidslinje, villkorade knappar och genast-mätare

Används i Potatispartiet (kapitel 2, nivå 10, fas 2). Koden finns i `mechanics/invaders/timeline.ts`. Allt är valfritt
i `invaders` och påverkar inte nivåer som inte använder det.

- **Flaggor:** villkoren läser flaggor. En flagga är satt om en regel (`"flagga"` i en fångstregel, `"taBortFlagga"`
  tar bort den), en händelse (steget `{ "gor": "flagga", "namn": … }`) eller en knapp satt den, eller om en räknare
  med samma namn är större än noll, även från en tidigare fas (t.ex. `fullmakt` från fas 1).
- **`tidslinje`:** datumet tickar fram från `startDatum`, en dag per `sekunderPerDag`. Linjen överst visar `fran`–`till`
  med `markeringar`, och dagens datum under. Varje passerat datum sätter flaggan `datum:ÅÅÅÅ-MM-DD`. `handelser` är
  engångshändelser knutna till ett datum (samma steg som `handelser`, plus `flagga` och `text`). Vid `slutDatum` ger
  `"vidSlut": "forlust"` förlust om nivån inte redan är avgjord.
- **`genast`:** genast-mätaren som ett stoppur (`x`, `y`, `r`). Den börjar tömmas när flaggan `startFlagga` sätts,
  töms på `sekunder`, tickar hörbart (`ljud`) och sätter flaggan `tomFlagga` när den är tom.
- **`knappar`:** villkorade knappar (`text`, `x`, `y`, `b`, `variant` "guld" eller "kontur"). `villkor` är en lista
  som prövas i ordning: `krav` (någon av flaggorna måste vara satt) eller `inte` (flaggan får inte vara satt), med
  `annars` = förklaringen som visas på den tonade knappen, t.ex. "Du ligger på sjukhus". `handling`: `"vinst"`,
  `"forlust"`, eller `{ "slapp": "telefon", "flagga": "utser" }` (släpp ett objekt ur strömmen och sätt en flagga).

```json
"tidslinje": {
  "fran": "1977-04-19", "till": "1977-05-16", "startDatum": "1977-05-01", "sekunderPerDag": 2.5, "y": 112,
  "markeringar": [{ "datum": "1977-04-19", "etikett": "19 apr" }, …, { "datum": "1977-05-16", "etikett": "16 maj" }],
  "handelser": [{ "datum": "1977-05-01", "steg": [{ "gor": "flagga", "namn": "klagomal", "langd": 0 },
                                                  { "gor": "pratbubbla", "text": "Odlare 1: ”Rötan har kommit!”", … }] }, …],
  "slutDatum": "1977-05-17", "vidSlut": "forlust"
},
"genast": { "namn": "Genast", "startFlagga": "klagomal", "sekunder": 6, "tomFlagga": "genast-tom", "x": 292, "y": 246, "r": 28, "ljud": "stoppur" },
"knappar": [
  { "text": "Ombudet reklamerar", "x": 104, "y": 694, "b": 176, "handling": "vinst",
    "villkor": [{ "krav": ["fullmakt", "telefon"], "annars": "Du har inget ombud" }, { "inte": "genast-tom", "annars": "För sent" }] },
  { "text": "Utse ombud nu", "x": 286, "y": 694, "b": 176, "variant": "kontur", "handling": { "slapp": "telefon", "flagga": "utser" },
    "villkor": [{ "krav": ["klagomal"], "annars": "Från 1 maj" }, { "inte": "fullmakt", "annars": "Ombud finns redan" }, …] },
  { "text": "Reklamera själv", "x": 195, "y": 756, "b": 352, "variant": "kontur", "handling": "forlust",
    "villkor": [{ "krav": ["datum:1977-05-14"], "annars": "Du ligger på sjukhus" }, { "krav": ["datum:1977-05-16"], "annars": "Från 16 maj" }] }
]
```

Övrigt nytt i invaders för Potatispartiet:
- `strom.typer.*.lagra`: fångade objekt läggs i ett lager (en rad) med en liten knapp, t.ex. "Öppna" på en plomberad
  säck. Ett tryck tillämpar `regel` en gång och kan byta utseende (`utseendeEfter`).
- `strom.typer.*.fart`: egen fallhastighet, t.ex. fullmakten som är lätt att missa.
- Vinstvillkoret `"strom-slut"`: strömmen (med `antal`) är slut, även planerade objekt.
- `hot.fran`: hoten släpps från en punkt (t.ex. bossen), spridda i sidled.
- `slutText`: en pratbubbla när nivån eller fasen är vunnen, t.ex. "Säckarna gick vidare till sex odlare."
- `musik`: bossmusik under spelet ("boss-d").
- Med faser räknas tidigare fasers räknare in i stjärnkraven (t.ex. `minAntal: { "fullmakt": 1 }` från fas 1).
- En regels `raknas` kan vara en lista, t.ex. `["fullmakt", "ombud"]`: båda räknarna ökar. Potatispartiet ger 2★
  med `minAntal: { "ombud": 1 }`, som både fullmakten (fas 1) och telefonen (fas 2) räknar.

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

**Ström av fångstobjekt, kulisser och engångshändelser (kapitel 2, nivå 1–2):** nivåer utan brickor och skott.
Spelaren styr bara i sidled och fångar det som faller. Allt är valfritt och påverkar inte nivåer som inte använder det.

- `brickor` och `skott` kan utelämnas.
- `strom`: fångstobjekt som släpps uppifrån på slumpvis x (`mechanics/invaders/stream.ts`). Varje typ i `strom.typer`
  har utseende (figur i art.ts, valfri `farg`), storlek, valfria `etiketter` (en väljs slumpvis), `fladder` (fladdrar
  lätt i sidled och vickar) och regler för `onFangst` och `onPass`: `matare` (misstag), `fyll` (fyller en mätare med
  `"lage": "fyll"`), `raknas`, `poang`, `text`, `ton` (`"bra"` guld eller `"neutral"` mörkgrön bubbla) och `ljud`.
  `antal` ger en bestämd omgång i slumpad ordning (t.ex. minst fyra förstörda dagar); `vikter` en oändlig ström.
  Tempot går från `intervall` till `slutIntervall` över nivåns tid.
- `matare.lage: "fyll"`: mätaren (visning `"kort"`) börjar tom och fylls av `fyll` i reglerna, t.ex. "Vanlig service".
- `summa`: ett räknarkort bredvid mätaren som visar en summa, t.ex. "Skadestånd 2 000 kr" efter tre fångade.
- `mal` och vinstvillkoret `"mal"`: vinst när räknaren nått sitt antal. Förlusten `"mal-omojligt"`: det finns inte
  längre tillräckligt många kvar i strömmen.
- `forManga` och förlusten `"for-manga"`: räknaren har gått över max, t.ex. fler än 8 missade kunder.
- `kulisser`: fasta figurer och texter bakom spelet (`fram: true` ritar framför spelaren, t.ex. en disk).
- `bakgrund: { "typ": "vag" }`: en väg i höjdled vars mittlinje rullar nedåt.
- `handelser`: engångshändelser i steg vid en viss tid (`mechanics/invaders/scenery.ts`). Stegen är `in` och `ut`
  (en figur glider in eller ut), `vicka`, `bubblor` (valfri `flack` som ligger kvar), `pratbubbla` och `vanta`. Varje
  steg har `langd`; nästa steg börjar efter `efter` ms (standard: `langd`). Spelaren kan inte påverka dem.

Tvättvattnet i förkortad form:

```json
"invaders": {
  "spelare": { "utseende": "kassor", "y": 726, "b": 44, "h": 54 },
  "kulisser": [{ "utseende": "pump", "x": 90, "y": 420, "b": 44, "h": 92 }, { "utseende": "hink", "x": 52, "y": 456 }, …,
               { "utseende": "kassadisk", "x": 195, "y": 797, "b": 390, "h": 94, "fram": true }],
  "strom": {
    "typer": { "kund": { "utseende": "kund", "b": 38, "h": 34,
      "onFangst": { "fyll": 1, "raknas": "betjanad", "ljud": "pling" },
      "onPass": { "raknas": "missad", "text": "Kunden gick", "ton": "neutral", "ljud": "miss" } } },
    "vikter": { "kund": 1 }, "intervall": 1500, "slutIntervall": 850, "fart": 150, "y": 170
  },
  "handelser": [{ "start": 25000, "steg": [
    { "gor": "in", "id": "skugga", "utseende": "skugga", "fran": [-30, 440], "till": [132, 440], "langd": 2200 },
    { "gor": "bubblor", "x": 162, "y": 446, "farg": "gron", "flack": [12, 3], "langd": 3200, "efter": 1400, "ljud": "pssst" },
    { "gor": "ut", "id": "skugga", "till": [-40, 440], "langd": 1800 }, …,
    { "gor": "pratbubbla", "x": 196, "y": 532, "text": "Lacken! Jag stämmer er!", "farg": "vinrod", "textFarg": "ljusbeige", "langd": 4200 }
  ] }],
  "tid": { "sekunder": 45, "etikett": "Tid kvar" },
  "matare": { "namn": "Vanlig service", "steg": 25, "visning": "kort", "lage": "fyll" },
  "forManga": { "raknare": "missad", "max": 8 },
  "vinst": ["overlev"], "forlust": ["for-manga"]
}
```

Semesterdagarna använder `antal` (4 förstörda, 6 lite sämre och 5 bra dagar i slumpad ordning), `summa`, `mal`
(3 förstörda dagar) och förlusterna `"matare-full"` (trovärdigheten) och `"mal-omojligt"`. Stjärnorna räknar fel
fångster med `maxAntal: { "fel": … }`.

**Växande mål och timing-klipp (kapitel 2, nivå 4 Oxelhäcken):** `vaxande` låter målen växa uppåt från en baslinje
(`mechanics/invaders/growth.ts`). Spelaren styr verktyget längs en klipplinje och släpper fingret för att klippa:
toppen ovanför linjen är ett rätt klipp, under linjen för tidigt, och ett mål som når maxhöjd är missat. Målen
hör till zoner (t.ex. din och grannens halva) med egna regler. Reglerna har samma fält som strömmens, plus
`matareMjuk` (mätaren sjunker utan att det räknas som misstag), `textEnGang` och `prat` (talbubbla första gången).
I förkortad form:

```json
"invaders": {
  "spelare": { "utseende": "hacksax", "y": 470, "b": 34, "h": 44 },
  "vaxande": {
    "baslinje": 650, "mal": [{ "x": 62, "zon": "din" }, …, { "x": 328, "zon": "granne" }],
    "b": 18, "viloHojd": 150, "maxHojd": 270, "kortHojd": 90,
    "fart": 30, "slutFart": 52, "intervall": 2200, "slutIntervall": 1000,
    "klipplinje": { "y": 470, "text": "160 cm – som ni kom överens om" },
    "zoner": {
      "din": { "farg": "morkgron", "vidKlipp": { "poang": 10, "raknas": "klipp" },
               "vidForTidigt": { "matare": 8, "raknas": "forTidigt", "text": "För kort! Det är inte brukligt", "ljud": "krasch" },
               "vidMissat": { "poang": -5, "raknas": "missat", "text": "Häcken växte ifrån dig", "ton": "neutral" } },
      "granne": { "farg": "gron", "kontur": "morkgron",
                  "vidKlipp": { "poang": 10, "raknas": "ingrepp", "matareMjuk": 1, "text": "Ingrepp – men som vanligt",
                                "textEnGang": true, "prat": { "x": 329, "y": 240, "text": "Låt bli!", … } }, … }
    }
  },
  "summa": { "namn": "Ingrepp", "text": "{varde}", "raknare": "ingrepp" },
  "tid": { "sekunder": 50, "etikett": "Tid kvar" },
  "matare": { "namn": "Grannsämja", "steg": 40, "visning": "kort" },
  "vinst": ["overlev"], "forlust": ["matare-full"]
}
```

**Etapper (kapitel 2, nivå 5 Trähuset):** `etapper` bygger upp en bild en del i taget: del nummer N (en kulisse)
tonas in när räknaren når N, t.ex. väggar, tak, skorsten och fönster för varje bindande avtal. Strömmens sorter kan
ha en liten pratbubbla (`bubbla`) och textens höjd (`etikettY`).

**Scriptad avslutning (kapitel 2, nivå 7 Salmonellan i skolköket):** en engångshändelse med `"start": "vinst"`
spelas när nivån är vunnen. Spelet fryser medan den pågår, och domslutet visas när den är klar. Med `"hoppaOver": true`
går den att hoppa över med ett tryck efter första gången nivån klarats. Stegen `lys` (en ring som pulserar runt en
punkt), `visa` (en figur som växer fram, valfritt från en punkt, med en textrad under) och `byt` (byter utseende på en
figur, t.ex. en kulisse med `id`) gör avslöjandet möjligt, och `tona` tonar ner spelplanen medan linsen visas. Övrigt nytt i invaders: `ljud` på bricktypernas `onHit` och
`onPass`, summakortet räknar också brickor som passerar (`raknas`), `summa.ljudVarje` spelar ett ljud vid jämna steg
(t.ex. ett "ding" var 1 000:e portion), och `brickor.upprepaVagor` börjar om vågorna tills nivån är avgjord.
I förkortad form:

```json
"kulisser": [{ "id": "larare", "utseende": "larare", "x": 64, "y": 790 }, { "utseende": "lunchbricka", "x": 300, "y": 782 }, …],
"brickor": { "typer": {
    "bricka": { "figur": "lunchbricka", "onPass": { "raknas": "portioner" } },
    "agg": { "figur": "agg", "onPass": { "raknas": "portioner" }, "onHit": { "effekt": "ta-bort", "poang": -10, "text": "Slöseri" } },
    "dalig": { "figur": "agg-dalig", "onHit": { "effekt": "ta-bort", "ljud": "plopp" },
               "onPass": { "matare": 1, "text": "Det där såg inte bra ut" } } },
  "rader": […], "vagor": […], "upprepaVagor": true, … },
"handelser": [{ "start": "vinst", "hoppaOver": true, "steg": [
  { "gor": "lys", "x": 300, "y": 782, "r": 30, "farg": "guld", "langd": 3000, "efter": 500 },
  { "gor": "tona", "topp": 152, "botten": 746, "farg": "ljusbeige", "alpha": 0.78, "langd": 400, "efter": 0 },
  { "gor": "visa", "id": "lins", "utseende": "lins-agg", "x": 195, "y": 420, "b": 170, "h": 170, "fran": [300, 782],
    "text": "Salmonella – osynlig för blotta ögat", "textY": 104, "langd": 2500, "efter": 1200, "ljud": "avslojande" },
  { "gor": "byt", "id": "larare", "utseende": "larare-illa", "langd": 1300 } ] }],
"summa": { "namn": "Portioner", "text": "{varde} / 9 500", "raknare": "portioner", "totalt": 9500, "antal": 38,
           "ljudVarje": { "varde": 1000, "ljud": "ding" } },
"matare": { "namn": "Hygien", "steg": 8, "visning": "kort" },
"mal": { "raknare": "portioner", "antal": 38 }, "vinst": ["mal"], "forlust": ["matare-full"]
```

**Styrning:** spelaren drar var som helst på skärmen för att flytta markören i sidled, och släpper för att skjuta.
Rörelsen är relativ, så tummen skymmer inte figuren. Släpp-för-att-skjuta är valt för att varje skott ska vara ett
medvetet val när fel skott kostar. Med `"lage": "auto"` skjuter spelaren i stället hela tiden medan fingret är nere.

**Ljud:** skott, träff, fångst, misstag och vinst spelas med Web Audio, plus kassans "pling", "mynt", häcksaxens "snip", "krasch", "hammare", "plopp", "ding", det dova ackordet "avslojande", "avdrag" (ett omvänt kaching), "nyckel" (nyckelpar i memory) och "stoppur" (genast-mätaren). Bossmusiken finns i två tonarter: "boss" (Flytdockan) och "boss-d" (Potatispartiet, invaders `musik`) som nivåerna kan välja i reglerna och händelserna. Memory har "flipp" (eller nivåns `vandLjud`, t.ex. "prassel"), "par", "miss" och "tick" när bevismätaren stiger. Ljudet slås av och på med högtalarknappen på kartan.

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

### Memorynivåer

Memory är ett rutnät med kort (t.ex. 4 × 4) där spelaren hittar par. Allt nivåspecifikt står i nivåfilens `memory`:
korten och deras parnycklar, specialkort med effekter (`dimma`, `blanda`), HUD-rubriker, valfri tid och mätare,
inforutan, teckenförklaringen och vinst- och förlustvillkoren. Stjärnorna räknas på antal drag (`stjarnkrav.maxDrag`).

- **Mall:** `src/levels/_mall-memory.json`, med alla fält förklarade i `src/levels/_mall-memory.md`.
- **Exempel:** Husbilen, `src/levels/kapitel-2/niva-03.json`.
- **Kod:** `src/mechanics/Memory.ts` (en ny effekt = en ny rad i `EFFEKTER`), `src/mechanics/memory/hud.ts` och
  `src/mechanics/memory/forms.ts` (symbolerna på korten).
- Korten är minst 72 punkter höga, och ett tredje kort går inte att vända medan två är uppe.
- Vändningen är en 3D-vändning på cirka 250 ms. Med reducerad rörelse i telefonens inställningar blir den en toning.
- Ljud: "flipp" när ett kort vänds, ett ljust ackord vid par och ett dovt ljud vid miss.

**Nyckelpar (kapitel 2, nivå 9 De två testamentena):** `nyckelpar: { "par": [...], "text": "..." }` gör vissa par
nödvändiga för vinst med `"vinst": "bevis"`. Når mätaren vinsttröskeln innan nyckelparen är hittade visas `text`
("Men finns testamentet kvar?") och spelet fortsätter tills de hittas eller tiden tar slut. Hittade nyckelpar får en
liten guldnyckel i hörnet och ett klingande ljud ("nyckel"). Nytt i samma nivå: `citat` (kort i Newsreader kursiv),
`kantBredd` (tunn guldram), `bevisvarde: 0`, tröskelns `notis` (liten rad under etiketten) och effektens `text`.
Vinsttröskeln är här "Styrkt" (85 %, `vinsttroskel: 1`), och "Övervägande sannolikt" är en svagare streckad linje.

**Bevismätare med trösklar (kapitel 2, nivå 6 Det sönderrivna testamentet):** `bevis` ger en stapel i procent
överst som stiger vid hittade par (kortens `bevisvarde`, annars `perPar`) och sjunker vid felvändningar (`perMiss`).
Tröskellinjerna har etiketter och en valfri text när de passeras. Med `"vinst": "bevis"` avslutas nivån med vinst
när mätaren passerar `vinsttroskel`, även om par återstår. Kort med `del` (`"vanster"`/`"hoger"`) är halvor av ett
sönderrivet papper med ojämn rivkant; när paret hittas glider halvorna ihop. `hud.missar` visar felvändningarna och
`hud.placering: "under"` ställer HUD-korten under rutnätet. `baksida` och `vandLjud` ändrar baksidans färger och
vändljudet. Domslutet kan ha en `fotnot` i mindre text. En lång titel bryts på två rader (är den bara lite för bred krymps den i stället). I förkortad form:

```json
"memory": {
  "kolumner": 4, "rader": 4,
  "kort": [{ "etikett": "Jag, Ingrid,", "par": "rad1", "del": "vanster", "bevisvarde": 8 },
           { "etikett": "förordnar att", "par": "rad1", "del": "hoger", "bevisvarde": 8 }, …,
           { "etikett": "Förvaringen", "par": "forvaring", "farg": "beige", "kant": "guld", "bevisvarde": 15 }, …],
  "hud": { "par": "Bitar ihop", "missar": "Felvändningar", "placering": "under" },
  "tid": { "sekunder": 80, "etikett": "Tid kvar" },
  "bevis": { "namn": "Bevisbörda: din", "perPar": 8, "perMiss": 3, "vinsttroskel": 0,
             "trosklar": [{ "varde": 55, "etikett": "Övervägande sannolikt", "text": "Övervägande sannolikt! Det räcker." },
                          { "varde": 90, "etikett": "Styrkt", "text": "Styrkt – mer än du behövde", "streckad": true }],
             "text": "Varje par flyttar stapeln. Förbi första strecket räcker." },
  "vinst": "bevis", "forlust": ["tid-slut"], "tipsUnderSpel": true,
  "baksida": { "farg": "gron", "kant": "morkgron", "stjarna": "guld" }, "vandLjud": "prassel"
}
```

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
och ger en varning i webbläsarens konsol när spelet startar. Kontrollen går igenom alla kapitelfiler och nivåfiler, texterna i `src/config/`, HTML-sidorna i `public/` och texterna i `store/`.
Den varnar också för **platshållarnivåer** (nivåfiler utan `domslut` eller med `"kommerSnart": true`, till exempel kapitel 2:s nio nivåer som inte är byggda) och för
kapitelfiler där `nivaer` inte stämmer med nivåfilerna i mappen.
Enda tillåtna undantaget är `[KONTAKT-E-POST]` i `public/integritet.html`; för den skrivs bara en påminnelse ut. Kör:

```bash
npm run kolla-platshallare
```

Kontrollen körs också automatiskt vid varje `npm run build` (även i GitHub Pages-bygget) och skriver då ut varningar.
Med `node scripts/kolla-platshallare.mjs --strikt` avslutas den med fel om något hittas (även platshållarnivåer). Använd det inför App Store.

## Platshållare

- **Kapitel 1: alla tio nivåer är spelbara.** **Kapitel 2** ("Civilrätten"): Husbilen är spelbar; de övriga nio
  är "kommer snart" (titel, referens, rättsområde och mekanik), låsta på kartan. Platshållarkontrollen varnar för dem.
- **Typsnitt**: Newsreader och Instrument Sans (OFL), lokalt i `public/fonts/`. Byts mot ABC Arizona i `public/fonts/typsnitt.css` + `src/config/theme.ts`.
- **Logotyp**: den riktiga, extraherad som vektor ur KAN:s varumärkesmanual (2026-11-16). Filerna är vita och färgas i spelet (`src/ui/Logo.ts`).
- **Spelvärden** för nivå 1 (kraft, vind, skadestånd 25 000 kr, mätaren −50 per bilträff) behöver provspelas. Slicen slumpas mellan 0,03 och 0,075 per slag (var fjärde åt andra hållet), siktlinjen visar 40 % av banan och bilen står strax ovanför green.
- **Domslutstexterna** `domslut.text` och `utfall` för nivå 1 har jag skrivit själv. De bör granskas.
- **Kontaktadressen** i integritetspolicyn (`public/integritet.html`) är `[KONTAKT-E-POST]`.
