// Letar efter platshållartext inom hakparenteser (t.ex. "[FYLLS I AV MÅLANSVARIG]") i nivåfilerna.
// Kör: npm run kolla-platshallare   (med --strikt avslutas det med fel om något hittas)
// Mallar (filer som börjar med _) hoppas över.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MAPP = 'src/levels';
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

for (const fil of readdirSync(MAPP).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort()) {
  sok(JSON.parse(readFileSync(join(MAPP, fil), 'utf8')), '', fil);
}

if (fynd.length === 0) {
  console.log('Platshållarkontroll: inga platshållare i nivåfilerna.');
} else {
  console.warn(`Platshållarkontroll: ${fynd.length} platshållare hittades:`);
  for (const f of fynd) console.warn('  ' + f);
  if (process.argv.includes('--strikt')) process.exit(1);
}
