// Skapar källbilderna för appikonen och startbilden i assets/ (används av @capacitor/assets):
//   assets/icon-only.png      1024×1024, mörkgrön #0F2827 med den lila fyruddiga stjärnan centrerad, ingen genomskinlighet
//   assets/splash.png         2732×2732, samma färg med stjärnan mindre
//   assets/splash-dark.png    samma som splash.png (appen ser likadan ut i mörkt läge)
// Kör: node scripts/skapa-ikoner.mjs && npx capacitor-assets generate --ios
import sharp from 'sharp';

const MORKGRON = '#0F2827';
const LILA = '#B47FAF';
// Samma stjärna som i spelet (src/ui/shapes.ts), rutnät 24×24, 22 enheter från spets till spets.
const STJARNA = 'M12 1C13 9 15 11 23 12C15 13 13 15 12 23C11 15 9 13 1 12C9 11 11 9 12 1Z';

function svg(sida, stjarnBredd) {
  const skala = stjarnBredd / 22;
  const forskj = sida / 2 - 12 * skala;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sida}" height="${sida}" viewBox="0 0 ${sida} ${sida}">
  <rect width="${sida}" height="${sida}" fill="${MORKGRON}"/>
  <path d="${STJARNA}" fill="${LILA}" transform="translate(${forskj} ${forskj}) scale(${skala})"/>
</svg>`;
}

async function skriv(fil, sida, stjarnBredd) {
  await sharp(Buffer.from(svg(sida, stjarnBredd))).flatten({ background: MORKGRON }).removeAlpha().png().toFile(fil);
  console.log(`${fil}: ${sida}×${sida}, stjärna ${stjarnBredd} px`);
}

await skriv('assets/icon-only.png', 1024, 600);
await skriv('assets/splash.png', 2732, 520);
await skriv('assets/splash-dark.png', 2732, 520);
