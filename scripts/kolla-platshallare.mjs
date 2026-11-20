// Letar efter platshållartext inom hakparenteser (t.ex. "[FYLLS I AV MÅLANSVARIG]") i nivåfilerna,
// i texterna i src/config/ (strings.ts, links.ts …), i HTML-sidorna i public/ och i App Store-materialet i store/.
// Undantag: public/integritet.html får innehålla [KONTAKT-E-POST] – då skrivs bara en påminnelse ut.
// Kör: npm run kolla-platshallare   (med --strikt avslutas det med fel om något hittas)
// Mallar (filer som börjar med _) hoppas över.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PLATSHALLARE = /\[[^\]\n]+\]/;
const fynd = [];

function sok(varde, sokvag, fil) {
  if (typeof varde === 'string') {
    if (PLATSHALLARE.test(varde)) fynd.push(`${fil}: ${sokvag}: "${varde}"`);
  } else if (Array.isArray(varde)) {
    varde.forEach((v, i) => sok(v, `${sokvag}[${i}]`, fil));
  } else if (varde && typeof varde === 'object') {
    for (const [k, v] of Object.entries(varde)) sok(v, sokvag ? `${sokvag}.${k}` : k, fil);
  }
}

// Nivåfilerna.
const NIVAER = 'src/levels';
for (const fil of readdirSync(NIVAER).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort()) {
  sok(JSON.parse(readFileSync(join(NIVAER, fil), 'utf8')), '', fil);
}

// Textsträngarna i konfigurationen (allt inom '…', "…" eller `…`).
const KONFIG = 'src/config';
const STRANG = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
for (const fil of readdirSync(KONFIG).filter((f) => f.endsWith('.ts')).sort()) {
  readFileSync(join(KONFIG, fil), 'utf8').split('\n').forEach((rad, i) => {
    for (const m of rad.matchAll(STRANG)) if (PLATSHALLARE.test(m[2])) fynd.push(`${fil}:${i + 1}: "${m[2]}"`);
  });
}

// HTML-sidorna i public/ och texterna i store/ (hela filen).
const UNDANTAG = { 'public/integritet.html': '[KONTAKT-E-POST]' };
const paminnelser = [];
const ALLA = new RegExp(PLATSHALLARE.source, 'g');
for (const mapp of ['public', 'store']) {
  if (!existsSync(mapp)) continue;
  for (const namn of readdirSync(mapp).filter((f) => /\.(html|md)$/.test(f)).sort()) {
    const fil = `${mapp}/${namn}`;
    readFileSync(fil, 'utf8').split('\n').forEach((rad, i) => {
      for (const m of rad.matchAll(ALLA)) {
        if (UNDANTAG[fil] === m[0]) paminnelser.push(`${fil}:${i + 1}`);
        else fynd.push(`${fil}:${i + 1}: "${m[0]}"`);
      }
    });
  }
}
if (paminnelser.length) {
  console.log(`Påminnelse: byt ut [KONTAKT-E-POST] mot en riktig e-postadress innan appen skickas in (${paminnelser.join(', ')}).`);
}

if (fynd.length === 0) {
  console.log('Platshållarkontroll: inga platshållare i nivåfilerna, texterna, public/ eller store/.');
} else {
  console.warn(`Platshållarkontroll: ${fynd.length} platshållare hittades:`);
  for (const f of fynd) console.warn('  ' + f);
  if (process.argv.includes('--strikt')) process.exit(1);
}
