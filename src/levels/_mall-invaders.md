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
| `resultat` | `"vinst"` eller `"halvvagsvinst"` (domslutet visar då rutorna Vunnet / Inte vunnet). Båda ger 0–3 stjärnor. |
| `stjarnkrav` | Krav för `en`, `tva` och `tre` stjärnor. Nivån måste vara vunnen. `maxMisstag`: högst så många misstag. `tidKvarOver`: mer än så många sekunder kvar. `minMatare`: minst så många procent kvar på mätaren. `maxDekorForlorade`: högst så många dekorfigurer förlorade. `maxAntal`: högst så många i namngivna räknare (`raknas` i `onHit`/`onPass`), t.ex. `{ "missad": 1 }`. Ett tomt krav `{}` = bara klarad. |
| `guldstjarna` | Valfritt. `{ "krav": {…}, "text": "…" }` ger en extra guldstjärna för en särskild bedrift (samma kravfält som `stjarnkrav`). Den visas på domslutet (med `text`) och på kartan, men räknas inte i stjärnräknaren och påverkar inte upplåsningen. |
| `bana.lager` | Bakgrunden. För en enfärgad bakgrund räcker `[{ "farg": "morkgron", "topp": 0 }]`. |
| `objekt` | Används inte av invaders. Lämna `[]`. |
| `forlust.rubrik` | Rubrik på förlustskärmen (t.ex. "Tryckt. Förtal."). |
| `forlust.orsaker` | Valfritt. Egen text per orsak: `matare-full`, `tid-slut`, `botten`, `for-manga`, `mal-omojligt`. Saknas texten används standardtexten i `src/config/strings.ts`. |
| `domslut` | `rubrik`, `text` (valfri), `domskal` (exakt 3), `lankTillFallet`, `utfall` (valfri rad per antal stjärnor). Halvvägsvinst: `vunnet` och valfritt `inteVunnet` (utan den visas bara Vunnet-rutan). |

Nästa nivå låses upp när den här har minst en stjärna.

## `invaders`

### `spelare`
| Fält | Vad det gör |
|---|---|
| `utseende` | Figur ur `src/mechanics/art.ts`, t.ex. `"textmarkor"`. En ny figur kräver ett tillägg där. |
| `y` | Spelarens mittpunkt i höjdled. |
| `b`, `h` | Storlek. Används för att rita figuren och för att fånga objekt. |
| `etikett` | Valfri text på spelaren, t.ex. `"BIL-\nREGISTRET"`. Krymps så att den ryms. |

### `skott`
| Fält | Vad det gör |
|---|---|
| `lage` | `"slapp"`: spelaren skjuter när fingret släpps (rekommenderas när fel skott kostar). `"auto"`: spelaren skjuter hela tiden medan fingret är nere (passar när allt ska skjutas bort). |
| `intervall` | Minsta tid mellan två skott, i ms. |
| `fart` | Skottets fart uppåt, i punkter per sekund. |
| `utseende` | Valfri figur för skottet, t.ex. `"stampelavtryck"`. Standard är en smal guldstav. |

### `brickor`
| Fält | Vad det gör |
|---|---|
| `typer` | Bricktyperna, se nedan. Varje bricka i `rader` anger en av dem i `typ`. |
| `rader` | Rader uppifrån och ner. Varje bricka är `{ "etikett", "typ", "plats" }`, eller `null` för en tom plats. |
| `typ` | En nyckel i `typer`, t.ex. `"fel"`, `"ratt"`, `"egen"` eller `"annan"`. Namnen väljer du själv. |
| `plats` | Valfritt. Brickans plats i slutraden vid vinst (0 = först). På en bricka med `ersattning` gäller den ersättningen. |
| `dold` | Valfritt (**reveal**). `{ "etikett": "Ej kontrollerad" }` gör brickan okänd: streckad beige kontur, guldfärgad ikon och den här etiketten. Första träffen avslöjar `typ` och `etikett` med en stämpelanimation, och brickan ligger kvar. Därefter gäller typens regler. |
| `ersattning` | Valfritt. Text som dyker upp på samma ställe när brickan skjutits bort, om typens `onHit` har `ersattTyp` (den nya brickans typ). |
| `b`, `h`, `mellanrum` | Brickstorlek och mellanrum. |
| `forskjutning` | Valfritt. Sidförskjutning per rad, t.ex. `[0, 35]` för att skjuta rad 2 en halv bricka. Det ger luckor att skjuta igenom. |
| `startY` | Översta radens överkant vid start. Rutnätet centreras i sidled mellan kanterna. |
| `steg` | Rutnätet flyttar sig `x` punkter var `intervall`:e ms. Vid kanten flyttar det sig `ned` punkter nedåt och byter riktning. |
| `kant` | Hur långt ut rutnätet får gå (`vanster`, `hoger`). |
| `visaTomma` | Ritar `null`-platser som streckade rutor. |
| `ikon` | Valfri figur ur art.ts på varje bricka (t.ex. `"bilsiluett"`), med etiketten i liten text under. Okända brickor får ikonen i guld, avslöjade rätt-brickor blir gröna. |
| `blanda` | Blandar brickornas platser varje gång nivån startar. |
| `figur` | Rita bara en figur ur art.ts (t.ex. `"ufo"`), utan ruta och etikett. |
| `skottGenom` | Skotten passerar brickorna, som alltså inte kan skjutas ner (t.ex. ufon som släpper hot). |
| `vagor` | Valfritt. Fler vågor: en lista där varje våg ersätter valfria fält ovan (t.ex. `rader`, `steg`, `mellanrum`, `forskjutning`, `blanda`) och kan ha `text` (pratbubbla). Nästa våg kommer när alla brickor i den förra är borta eller har passerat. Vinstvillkoren `alla-klara` och `fel-borta` gäller först efter sista vågen. |
| `fastBredd` | Rutnätet vänder vid kanten räknat på hela den ursprungliga bredden. Då kommer det ner i samma takt även när brickor försvunnit. Utan detta (som i klassisk invaders) går färre brickor längre i sidled och kommer ner långsammare. |

Ett skott tar den första bricka det möter.

### `brickor.typer`: bricktyper med `onHit` och `onPass`
Varje typ bestämmer utseende och vad som händer. Exempel: i Löpsedeln ska `fel` skjutas bort och `ratt` får inte
träffas; i Kolsyretuberna är det tvärtom (`egen` ska fyllas, `annan` får passera).
| Fält | Vad det gör |
|---|---|
| `stil` | `"mork"` (standard): vinröd ruta med lila kant. `"ljus"`: beige ruta med mörk text (grön om brickorna har `ikon`). |
| `figur` | Valfri figur ur art.ts i stället för ruta, med etiketten i liten text under, t.ex. `"tub-egen"`. |
| `etikettFarg` | Färg på etiketten under figuren, t.ex. `"vinrod"`. Standard: `"morkgron"`. |
| `smalTraff` | Valfritt. Träffytan krymps så många punkter per sida, så att skott som nästan går fri släpps igenom (bra för brickor som inte ska träffas). |
| `skaBort` | Räknas i vinstvillkoret `fel-borta`: alla brickor av typen ska vara borta. |
| `onHit` | Vid träff. `effekt`: `"ta-bort"` (försvinner), `"fyll"` (fylls med en stigande nivå, lämnar uppåt, fräsande ljud) eller `"skaka"` (ligger kvar). Dessutom valfritt `poang`, `matare` (steg på mätaren), `misstag: true` (räknas i `maxMisstag`, med blink och skakning; `matare` räknas alltid som misstag), `text` (pratbubbla), `raknas` (namn på en räknare, se `maxAntal`) och `ersattTyp` (med `"ta-bort"`: brickans `ersattning` dyker upp som en bricka av den typen). Utelämnas `onHit` stoppas skottet utan effekt. |
| `onPass` | När brickan når spelaren: `poang`, `matare` (räknas som misstag), `text` och `raknas`. `{}` = brickan passerar och inget händer. Utelämnas `onPass` stannar brickan, och nivån förloras om `forlust` innehåller `"botten"`. Bubblan är vinröd vid mätarsteg, mörkgrön vid poängavdrag eller när passagen räknas (`raknas`), och annars guld. |
| `onPassDold` | Som `onPass` men för en bricka som fortfarande är dold (reveal). Utelämnas = `onPass`. |

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
| `tid` | Valfritt. `{ "sekunder", "etikett", "dold" }`. Med `dold: true` går klockan men visas inte. Klockan visas som MM:SS, t.ex. 00:45. Med `matare.visning: "kort"` står den i ett eget kort till höger. |
| `matare` | `namn` (t.ex. "Förtalsrisk"), `steg` (antal steg innan mätaren är full), `status` (valfri text till höger), `visning`: `"steg"` (standard, rutor längst ner som fylls) eller `"procent"` (procent kvar uppe till höger, t.ex. "God tro 100 %", tar klockans plats) eller `"kort"` (kort under rubriken med en guldstapel som börjar full och krymper, t.ex. "Försäkringen", med `dekor.raknare` som ett kort bredvid) eller `"antal"` (namnet, t.ex. INTRÅNG, över en stor vinröd siffra uppe till höger; tar klockans plats). |
| `infotext` | Valfritt. Längre text i en ruta under rubriken, t.ex. uppdraget. Grön på mörkt tema, ljusbeige på ljust. |
| `tipsUnderSpel` | Valfritt. `true` visar Fylgia-tipset i en ruta längst ner medan man spelar (mörk på ljust tema, ljus på mörkt). Placera då spelaren ovanför rutan, t.ex. `y` 640. |
| `misstag`, `misstagText` | Bara med `fangst`: `{ "fangstMissad": 1 }` steg på mätaren och valfri pratbubbla när ett fångstobjekt missas. |
| `info` | Valfritt. Rutan under rubriken. Den första posten står till vänster, den sista till höger. `serif: true` sätter värdet i serif, som "KROGKUNG". |
| `instruktion` | Valfritt. Kort text på planen (`text`, `y`) som tonas bort efter 6 sekunder. |
| `vinst` | Alla villkor måste gälla: `"fel-borta"` (alla brickor vars typ har `skaBort` är borta), `"alla-fangade"` (alla fångstobjekt fångade), `"alla-klara"` (varje bricka bortskjuten eller släppt igenom), `"overlev"` (tiden har gått ut utan förlust, kräver `tid`) och/eller `"mal"` (räknaren i `mal` har nått sitt antal). |
| `forlust` | Något av villkoren ger förlust: `"matare-full"`, `"tid-slut"`, `"botten"` (en bricka når spelaren), `"for-manga"` (räknaren i `forManga` har gått över `max`) eller `"mal-omojligt"` (det finns inte längre tillräckligt många kvar i `strom` för att nå `mal`). |
| `slutrad` | Valfritt. `{ "y" }`. Vid vinst flyttas allt med `plats` till en rad på den höjden, t.ex. KROGKUNG. |

### `hot` (valfritt): fallande hot
Föremål som faller och ska skjutas ner innan de når spelaren. Det är motsatsen till fångstobjekt.
| Fält | Vad det gör |
|---|---|
| `utseende`, `b`, `h` | Figur ur art.ts (t.ex. `"uppsagningsbrev"`) och storlek (träffyta). |
| `etikett`, `visaEtikett` | Valfri pratbubbla under hotet. `"forsta"` (standard) visar den bara på det första hotet, `"alltid"` på alla. |
| `start` | `"fran-fiende"`: släpps från en slumpvis fiende. `"slumpvis-overst"`: slumpvis x på höjden `y`. |
| `fart` | Fallhastighet, i punkter per sekund. |
| `intervall`, `slutIntervall` | Tid mellan hoten (ms) i början och i slutet. Tempot ändras jämnt över nivåns `tid`. |
| `fordrojning` | Väntetid innan första hotet (ms). |
| `botten` | Vad som händer när ett hot når spelaren: `matare` (steg, räknas som misstag), `poang` och `text`. |

### `dekor` (valfritt): dekorhändelser
Bakgrundsanimationer. Utan `raddning` kan spelaren inte påverka dem och de har ingen kollision.
| Fält | Vad det gör |
|---|---|
| `figurer` | Figurerna som händelserna verkar på: `{ "utseende", "x", "y" }`, t.ex. åtta kor. |
| `handelse.rorelse` | `"lyft"`: en slumpvis kvarvarande figur lyfts upp i en ljuskägla från närmaste fiende och försvinner. |
| `handelse.intervall`, `start`, `langd` | Tid mellan händelserna, tid till den första och hur länge en händelse pågår (ms). När figurerna är slut slutar händelserna, men nivån fortsätter. |
| `handelse.vaxla` | Valfri figur att växla med under händelsen, t.ex. `"ko-sprattel"` (sprattlande ben). |
| `handelse.ljud` | Valfritt ljud, t.ex. `"muu"`. |
| `handelse.raddning` | Valfritt. `{ "text": "Kon räddad!" }`: ett skott som träffar källan (ufot) under händelsen avbryter den, och figuren faller tillbaka. Förlorade figurer räknas i `maxDekorForlorade`. |
| `raknare` | Valfri räknare i ett kort bredvid mätaren (kräver `matare.visning: "kort"`). `text` med `{kvar}` och `{totalt}`, t.ex. `"{kvar} av {totalt}"`. |

### Sköldläge och märkta projektiler (valfritt)
Spelaren skjuter inte utan styr en sköld. Se nivå 9 (`niva-09.json`) och README för ett komplett exempel.
| Fält | Vad det gör |
|---|---|
| `skold` | Slår på sköldläget. `etikett`: text under skölden. `spelare` blir skölden (t.ex. `"utseende": "skold"`); `skott` behövs inte. |
| `skyddas` | Det som står under skölden: `utseende`, valfritt `ledsen` (figur vid fel), `x`, `y`, `b`, `h`, `etikett`. |
| `skyttar.skyttar` | Rutor som skjuter: `id`, `etikett`, `ikon`, mittpunkt `x`/`y`, `b`, `h`, och `typer` med vikt. |
| `skyttar.typer` | Projektiltyper: `etikett`, `farg`, valfritt `streckad`, och `kategori`. |
| `skyttar.markningar` | Märkningarna, t.ex. `["A", "B", "C"]`. Varje projektil får en slumpvis. |
| `skyttar.kategorier` | Regel per kategori: `"en-per-markning"`, `"slapp-alltid"` eller `"blockera-alltid"`, och utfallen `vidFelBlock` / `vidFelSlapp` (`matare`, `text`, `ledsen` i ms). |
| `skyttar.fart`, `intervall`, `slutIntervall`, `fordrojning`, `samtidigt` | Fart (punkter/s), tid mellan skotten från början till slut, väntan före första, och fler per salva från en andel av tiden. |
| `skyttar.mal` | Var projektilerna siktar (`x`, `y`) och spridning i sidled. |
| `skyttar.flikar` | Flikar för märkningarna (`x`, `y`, `prefix`, `rubrik`) som tänds vid första träffen. |
| `hornruta` | Liten ruta uppe till höger: `rubrik` och `text`. |
| `introSteg` | Förklaring i steg (tryck för nästa) första gången nivån spelas. |

### Ström av fångstobjekt (valfritt)
Nivåer där spelaren bara fångar det som faller, med olika regler per sort. Se kapitel 2, nivå 1 (`tvattvattnet`) och 2 (`semesterdagarna`). `brickor` och `skott` kan då utelämnas.
| Fält | Vad det gör |
|---|---|
| `strom.typer` | Sorterna: `utseende` (figur i art.ts), `b`, `h`, valfritt `farg` (för figurer som kan färgas, t.ex. `"kalenderblad"`), `etiketter` (text på objektet; en väljs slumpvis), `etikettFarg`, `fladder` (fladdrar lätt i sidled och vickar) och reglerna `onFangst` och `onPass`. |
| `onFangst`, `onPass` | `matare` (steg på mätaren, ett misstag med blink), `fyll` (steg på en mätare med `lage: "fyll"`), `raknas` (namngiven räknare), `poang`, `text` (pratbubbla), `ton` (`"bra"` guld, standard, eller `"neutral"` mörkgrön) och `ljud` (t.ex. `"pling"`, `"mynt"`, `"miss"`; standard vid fångst `"fanga"`). |
| `strom.antal` | En bestämd omgång: så många av varje sort, i slumpad ordning varje gång, t.ex. `{ "forstord": 4, "lite": 6, "bra": 5 }`. |
| `strom.vikter` | I stället för `antal`: en oändlig ström med sannolikhet per sort, t.ex. `{ "kund": 1 }`. |
| `strom.intervall`, `slutIntervall`, `fordrojning` | Tid mellan objekten (ms) i början och i slutet (tempot ändras jämnt över nivåns `tid`), och väntan före det första. |
| `strom.fart`, `y`, `kant` | Fallhastighet (punkter/s), starthöjd, och valfritt `{ "vanster", "hoger" }` för var objekten släpps. |
| `matare.lage` | `"fyll"`: mätaren (visning `"kort"`) börjar tom och fylls av `fyll`, t.ex. "Vanlig service". Misstag påverkar den inte. |
| `summa` | Räknarkort bredvid mätaren (visning `"kort"`): `namn`, `text` med `{varde}`, `raknare`, `totalt` och `antal`. Visar `totalt × fångade / antal`, t.ex. 2 000 kr efter 3. |
| `mal` | `{ "raknare", "antal" }` för vinsten `"mal"` och förlusten `"mal-omojligt"`. |
| `forManga` | `{ "raknare", "max" }` för förlusten `"for-manga"`, t.ex. fler än 8 missade kunder. |

### Kulisser, rullande väg och engångshändelser (valfritt)
| Fält | Vad det gör |
|---|---|
| `kulisser` | Fasta figurer bakom spelet: `{ "utseende", "x", "y", "b", "h", "farg" }`, valfritt med `text` (`textY`, `textFarg`, `textStorlek`). Utan `utseende` blir det bara text. `fram: true` ritar framför spelaren, t.ex. en kassadisk. |
| `bakgrund` | `{ "typ": "vag", "x", "b", "topp", "fart" }`: en väg i höjdled vars streckade mittlinje rullar nedåt. |
| `handelser` | Engångshändelser: `{ "start": ms, "steg": […] }`. Varje steg har `gor`, `langd` (ms), valfritt `efter` (när nästa steg börjar, standard `langd`) och `ljud`. Stegen: `in` (`id`, `utseende`, `b`, `h`, `fran`, `till`: en figur glider in), `ut` (`id`, `till`), `vicka` (`id`), `bubblor` (`x`, `y`, `farg`, valfri `flack` [rx, ry] som ligger kvar), `pratbubbla` (`x`, `y` = spetsen, `text`, `farg`, `textFarg`) och `vanta`. Spelaren kan inte påverka dem. |

En nivå utan brickor kan ha `"rader": []` eller utelämna `brickor`.
I `_mall-invaders.json` ligger fälten för sköldläget under `_skoldlage_exempel`. Flytta upp dem direkt i `invaders` (och ta bort nyckeln) för att använda dem.
