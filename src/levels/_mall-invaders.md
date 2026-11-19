# Mall för invaders-nivåer

Kopiera `_mall-invaders.json` till `niva-NN.json`. Filer som börjar med `_` läses inte in, så mallen syns aldrig i spelet.
Fyll sedan i fälten nedan. Nivå 2 (`niva-02.json`, Löpsedeln) är ett komplett exempel.
Alla koordinater är i logiska punkter på en skärm som är 390 × 844 (x åt höger, y nedåt).

## Gemensamt för alla nivåer

| Fält | Vad det gör |
|---|---|
| `id` | Unikt id. Används när framstegen sparas, så ändra det inte efter release. |
| `nummer` | Plats på kartan (1–10). |
| `titel`, `referens` | Visas på kartan och i nivåns rubrik. |
| `mekanik` | `"invaders"`. |
| `fylgiaMal` | `true` ger märket "Fylgia-mål". |
| `etikett` | Valfri text på kartan i stället för "Invaders" (t.ex. `"Boss"`). |
| `tema` | `"mork"` ger ljusa rubriker på mörk bakgrund. `"ljus"` är standard. |
| `uppdragstext`, `fylgiaTips` | Visas i rutan "Din fylgia viskar" innan spelaren trycker Starta. |
| `resultat` | `"vinst"` eller `"halvvagsvinst"` (då halveras stjärnorna, max 1,5). |
| `stjarnkrav` | Krav för `en`, `tva` och `tre` stjärnor. Nivån måste vara vunnen. `maxMisstag`: högst så många misstag. `tidKvarOver`: mer än så många sekunder kvar. Ett tomt krav `{}` = bara klarad. |
| `bana.lager` | Bakgrunden. För en enfärgad bakgrund räcker `[{ "farg": "morkgron", "topp": 0 }]`. |
| `objekt` | Används inte av invaders. Lämna `[]`. |
| `forlust.rubrik` | Rubrik på förlustskärmen (t.ex. "Tryckt. Förtal."). |
| `forlust.orsaker` | Valfritt. Egen text per orsak: `matare-full`, `tid-slut`, `botten`. Saknas texten används standardtexten i `src/config/strings.ts`. |
| `domslut` | `rubrik`, `text` (valfri), `domskal` (exakt 3), `lankTillFallet`, `utfall` (valfri rad per antal stjärnor). |

Nästa nivå låses upp när den här har minst en stjärna.

## `invaders`

### `spelare`
| Fält | Vad det gör |
|---|---|
| `utseende` | Figur ur `src/mechanics/art.ts`, t.ex. `"textmarkor"`. En ny figur kräver ett tillägg där. |
| `y` | Spelarens mittpunkt i höjdled. |
| `b`, `h` | Storlek. Används för att rita figuren och för att fånga objekt. |

### `skott`
| Fält | Vad det gör |
|---|---|
| `lage` | `"slapp"`: spelaren skjuter när fingret släpps (rekommenderas när fel skott kostar). `"auto"`: spelaren skjuter hela tiden medan fingret är nere (passar när allt ska skjutas bort). |
| `intervall` | Minsta tid mellan två skott, i ms. |
| `fart` | Skottets fart uppåt, i punkter per sekund. |

### `brickor`
| Fält | Vad det gör |
|---|---|
| `rader` | Rader uppifrån och ner. Varje bricka är `{ "etikett", "typ", "plats" }`, eller `null` för en tom plats. |
| `typ` | `"fel"` ska skjutas bort. `"ratt"` får inte träffas: en träff är ett misstag och brickan blir kvar. |
| `plats` | Valfritt. Brickans plats i slutraden vid vinst (0 = först). På en fel-bricka med `ersattning` gäller den ersättningen. |
| `ersattning` | Valfritt, bara på fel-brickor. Rätt bokstav eller text som dyker upp på samma ställe när fel-brickan skjutits bort. Den nya brickan är en rätt-bricka. |
| `b`, `h`, `mellanrum` | Brickstorlek och mellanrum. |
| `forskjutning` | Valfritt. Sidförskjutning per rad, t.ex. `[0, 35]` för att skjuta rad 2 en halv bricka. Det ger luckor att skjuta igenom. |
| `startY` | Översta radens överkant vid start. Rutnätet centreras i sidled mellan kanterna. |
| `steg` | Rutnätet flyttar sig `x` punkter var `intervall`:e ms. Vid kanten flyttar det sig `ned` punkter nedåt och byter riktning. |
| `kant` | Hur långt ut rutnätet får gå (`vanster`, `hoger`). |
| `visaTomma` | Ritar `null`-platser som streckade rutor. |

Ett skott tar den första bricka det möter. Rätt-brickornas träffyta är 3 punkter smalare på varje sida än den syns, så att skott som nästan går fri släpps igenom.

### `fangst` (valfritt)
Saker som faller och ska fångas av spelaren.
| Fält | Vad det gör |
|---|---|
| `etikett` | Text i cirkeln. |
| `x`, `y` | Startpunkt (mittpunkt). |
| `fart` | Fallhastighet, i punkter per sekund. |
| `fordrojning` | Väntetid innan objektet börjar falla, i ms. |
| `radie` | Storlek. Standard är 20. |
| `aterkommer` | Om ett missat objekt börjar om uppifrån. Standard är `true`. Med `false` går nivån inte att vinna om villkoret `alla-fangade` gäller. |
| `plats` | Plats i slutraden. |

Skotten passerar fångstobjekten utan att påverka dem.

### `skydd` (valfritt)
Block som stoppar spelarens skott och slits ner.
| Fält | Vad det gör |
|---|---|
| `etikett` | Text i blocket (t.ex. "RÄTTELSE"). |
| `x`, `y`, `b`, `h` | Mittpunkt och storlek. |
| `talighet` | Hur många skott blocket tål. |

### Övrigt
| Fält | Vad det gör |
|---|---|
| `tid` | Valfritt. `{ "sekunder", "etikett" }`. Upp till 60 sekunder visas som 00:SS, längre tider som MM:SS. |
| `matare` | `namn` (t.ex. "Förtalsrisk"), `steg` (antal steg innan mätaren är full), `status` (valfri text till höger). |
| `misstag` | Hur många steg mätaren stiger per misstag: `rattTraffad` (en rätt-bricka träffas) och `fangstMissad` (ett fångstobjekt missas). |
| `info` | Valfritt. Rutan under rubriken. Den första posten står till vänster, den sista till höger. `serif: true` sätter värdet i serif, som "KROGKUNG". |
| `instruktion` | Valfritt. Kort text på planen (`text`, `y`) som tonas bort efter 6 sekunder. |
| `vinst` | Alla villkor måste gälla: `"fel-borta"` (alla fel-brickor bortskjutna) och/eller `"alla-fangade"` (alla fångstobjekt fångade). |
| `forlust` | Något av villkoren ger förlust: `"matare-full"`, `"tid-slut"`, `"botten"` (en bricka når spelaren). |
| `slutrad` | Valfritt. `{ "y" }`. Vid vinst flyttas allt med `plats` till en rad på den höjden, t.ex. KROGKUNG. |
