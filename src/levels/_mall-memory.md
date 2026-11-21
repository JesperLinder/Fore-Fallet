# Mall för memorynivåer

Kopiera `_mall-memory.json` till kapitlets mapp (t.ex. `src/levels/kapitel-2/niva-06.json`) och lägg nivåns `id` i
`nivaer` i kapitlets `kapitel.json`. Filer som börjar med `_` läses inte in, så mallen syns aldrig i spelet.
Nivå 3 i kapitel 2 (`kapitel-2/niva-03.json`, Husbilen) är ett komplett exempel.

Mallen visar alla möjligheter på en gång (mätare, blandkort, dimkort och ett par av två olika kort).
Ta bort det som inte behövs.

## Gemensamt för alla nivåer

| Fält | Vad det gör |
|---|---|
| `id` | Unikt id i hela spelet. Används när framstegen sparas, så ändra det inte efter release. |
| `titel`, `referens`, `rattsomrade` | Visas på kartan ("NJA 1996 s. 598 · Köprätt") och i nivåns rubrik. |
| `mekanik` | `"memory"`. |
| `kartmarke` | Märket efter titeln på kartan: `{ "text": "Memory", "farg": "lila" }`. |
| `rubrikmarke`, `rubrikmarkeFarg` | Märket efter nivåetiketten i nivåns rubrik ("K2 · NIVÅ 3 · NJA 1996 S. 598  MEMORY"). |
| `uppdragstext`, `fylgiaTips` | Visas i rutan "Din fylgia viskar" innan spelaren trycker Starta. Med `tipsUnderSpel` står tipset kvar längst ner under spelet. |
| `resultat` | `"vinst"` eller `"halvvagsvinst"`. |
| `stjarnkrav` | Stjärnor efter antal drag: `{ "tre": { "maxDrag": 14 }, "tva": { "maxDrag": 20 }, "en": {} }`. Ett drag = två vända kort. `en: {}` = vunnen. Det går också att använda `tidKvarOver` och `maxMisstag` (missar). |
| `tema`, `bana.lager` | `"ljus"` och en ljusbeige bakgrund: `[{ "farg": "ljusbeige", "topp": 0 }]`. |
| `objekt` | Används inte av memory. Lämna `[]`. |
| `forlust` | `rubrik` och en text per orsak (`tid-slut`, `matare-full`). Knappen "Försök igen" finns alltid. |
| `domslut` | `rubrik`, `domskal` (exakt 3), `lankTillFallet`, valfritt `text`, `utfall` och `fotnot` (en rad i mindre text sist i domskälsrutan). |

## `memory`

| Fält | Vad det gör |
|---|---|
| `kolumner`, `rader` | Rutnätets storlek, t.ex. 4 × 4. Korten får minst 72 och högst 100 punkters höjd. Fler än 4 kolumner gör korten smala. |
| `hud` | Rubrikerna i HUD:en: `{ "par": "Par", "drag": "Drag" }`. Visas som "Par 3 / 8" och "Drag 5". Med `"missar": "Felvändningar"` visas antalet felvändningar (ange `drag`, `missar` eller båda). `"placering": "under"` ställer korten under rutnätet (standard: över). |
| `tid` | Valfritt: `{ "sekunder": 75, "etikett": "Tid kvar" }`. Klockan startar när spelaren trycker Starta och blir lila de sista tio sekunderna. |
| `matare` | Valfritt: `{ "namn": "Misstanke", "steg": 6 }`. En stapel under HUD:en som fylls ett steg per miss. |
| `infotext` | Text i den mörkgröna rutan under HUD:en. |
| `kort` | Korten, se nedan. Antalet kort ska vara `kolumner × rader`. Korten blandas om varje gång nivån startar. |
| `teckenforklaring` | Rader under rutnätet. `typ`: `"hittat"` (hittat par), `"kort"` (en ruta i `farg`) eller `"dimma"`. |
| `vinst` | `"alla-par"`: alla par hittade. `"bevis"`: bevismätaren passerade vinsttröskeln (se nedan). |
| `bevis` | Valfritt: bevismätaren, se nedan. |
| `baksida` | Valfritt: baksidans färger, t.ex. `{ "farg": "gron", "kant": "morkgron", "stjarna": "guld" }` på mörk bakgrund. Standard: mörkgrön med lila stjärna. |
| `vandLjud` | Valfritt: ljudet när ett kort vänds, t.ex. `"prassel"` för papper. Standard `"flipp"`. |
| `forlust` | Lista med förlustvillkor: `"tid-slut"` och/eller `"matare-full"`. |
| `vandTillbakaMs` | Hur länge två kort som inte matchar ligger uppe innan de vänds tillbaka (standard 800). |
| `tipsUnderSpel` | `true`: fylgians tips står kvar längst ner under spelet. |

### Ett kort

| Fält | Vad det gör |
|---|---|
| `etikett` | Texten på framsidan. Långa ord krymps så att de inte bryts mitt i. |
| `par` | **Parnyckeln.** Två kort med samma nyckel är ett par, även om etiketterna skiljer sig (t.ex. `"Mögellukt"` + `"Fuktskadan"`, båda `"par": "fukt"`). |
| `antal` | Antal likadana kort, standard 1. Ett par av två likadana kort: `"antal": 2`. Två olika kort som är ett par skrivs som två rader med samma `par`. |
| `farg` | Framsidans färg, standard `ljusbeige`. På mörka färger (`morkgron`, `gron`, `vinrod`, `morkockra`) blir texten ljus. |
| `form` | Valfri symbol ovanför texten: `tak`, `golv`, `dorr`, `fonster`, `vagg`, `horn`, `lukt`, `droppe`, `pratbubbla`, `stjarna`, `cirkel`. Nya symboler läggs till i `src/mechanics/memory/forms.ts`. |
| `kant` | Valfri färgad kant när kortet är vänt, t.ex. `"guld"`. `kantBredd` ändrar bredden (standard 3), t.ex. 1,5 för en tunn guldram. |
| `citat` | Valfritt: `true` sätter texten i Newsreader kursiv, för citatkort som `'Det ligger bra där det ligger'`. |
| `effekt` | Valfri specialeffekt när kortet vänds upp, se nedan. |
| `del` | Valfritt: `"vanster"` eller `"hoger"` gör kortet till en halva av ett sönderrivet papper, med ojämn rivkant på den sida där halvorna möts, texten i serif och etiketten VÄNSTER/HÖGER. Båda halvorna i ett par får samma rivkant. När paret hittas glider halvorna ihop till en hel remsa och tillbaka, och ligger sedan nedtonade. |
| `bevisvarde` | Valfritt: hur många procent paret flyttar bevismätaren (det högsta av parets två kort gäller). `0` = paret flyttar inte mätaren. Standard: `bevis.perPar`. |

### Bevismätare med trösklar (valfritt)

En stapel i procent överst, under rubriken. Den stiger vid varje hittat par och sjunker vid varje felvändning.
Se kapitel 2, nivå 6 (`testamentet`). I `_mall-memory.json` ligger ett exempel under `_bevis_exempel`.

| Fält | Vad det gör |
|---|---|
| `namn` | Etiketten över stapeln, t.ex. `"Bevisbörda: din"`. |
| `start` | Startvärde i procent (standard 0). |
| `perPar`, `perMiss` | Procent upp per hittat par (om korten inte har `bevisvarde`) och procent ner per felvändning. Mätaren går inte under 0 eller över 100. |
| `trosklar` | Tröskellinjerna: `{ "varde": 55, "etikett": "Övervägande sannolikt", "text": "…", "streckad": false, "notis": "…" }`. Etiketten står under linjen (ligger två linjer nära varandra flyttas etiketterna isär). `notis` är en liten kursiv rad under etiketten, t.ex. "Räcker inte den här gången." `text` visas som en guldbubbla när mätaren passerar tröskeln uppåt. `streckad: true` ger en svagare streckad linje. |
| `vinsttroskel` | Index i `trosklar` för tröskeln som avgör vinsten (med `"vinst": "bevis"`). När den passeras avslutas nivån med vinst strax efter texten, även om par återstår. Passeras flera trösklar i samma drag visas alla texter. |
| `text` | Valfri rad under stapeln, t.ex. `"Varje par flyttar stapeln. Förbi första strecket räcker."` |

**Nyckelpar** (`nyckelpar: { "par": ["bankfack"], "text": "Men finns testamentet kvar?" }`): paren med de här
parnycklarna måste vara hittade för vinst, även om mätaren redan nått vinsttröskeln. Når mätaren tröskeln innan dess
visas `text` i stället för tröskelns text, och spelet fortsätter tills nyckelparen hittas (då vinner man direkt, med
tröskelns text, om mätaren fortfarande är över tröskeln) eller tiden tar slut. Hittade nyckelpar får en liten
guldnyckel i hörnet och ett klingande ljud. Se kapitel 2, nivå 9 (`tva-testamenten`).

En effekt kan ha `text` (en guldbubbla när kortet vänds), t.ex. `{ "typ": "blanda", "text": "HD: var mycket försiktig" }`.

Stjärnorna kan räknas på felvändningar med `maxMisstag`. Ett "tick" hörs när mätaren stiger.

### Effekter

| `typ` | Vad den gör |
|---|---|
| `dimma` | Lägger dimma över korten runt omkring i `sekunder` (standard 3). `avstand` 1 = de närmaste korten, även diagonalt. Dimmiga kort syns suddiga och går inte att vända förrän dimman lättat. Kort som redan är uppe eller hittade påverkas inte. |
| `blanda` | Blandar om alla kort som inte är hittade, när draget är klart (efter att korten vänts tillbaka eller paret hittats). |

En ny effekt läggs till som en rad i `EFFEKTER` i `src/mechanics/Memory.ts` (och beskrivs i `MemoryEffekt` i
`src/core/levelTypes.ts` och här).

## Regler i mekaniken

- Spelaren vänder två kort per drag. Samma parnyckel = hittat par (lila kant och stjärna), annars vänds de tillbaka.
- Ett tredje kort går inte att vända medan två är uppe.
- Vändningen är en kort 3D-vändning (cirka 250 ms). Med inställningen för reducerad rörelse i telefonen byts den
  mot en snabb toning.
- Ljud: ett mjukt "flipp" när ett kort vänds, ett ljust ackord vid par och ett dovt ljud vid miss (följer ljudknappen).
