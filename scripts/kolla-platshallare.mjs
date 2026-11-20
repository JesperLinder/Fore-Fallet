// Letar efter platshållartext inom hakparenteser (t.ex. "[FYLLS I AV MÅLANSVARIG]") i nivåfilerna
// och i texterna i src/config/ (strings.ts, links.ts …).
// Kör: npm run kolla-platshallare   (med --strikt avslutas det med fel om något hittas)
// Mallar (filer som börjar med _) hoppas över.
import { readdirSync, readFileSync } from 'node:fs';
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

if (fynd.length === 0) {
  console.log('Platshållarkontroll: inga platshållare i nivåfilerna eller texterna.');
} else {
  console.warn(`Platshållarkontroll: ${fynd.length} platshållare hittades:`);
  for (const f of fynd) console.warn('  ' + f);
  if (process.argv.includes('--strikt')) process.exit(1);
}
