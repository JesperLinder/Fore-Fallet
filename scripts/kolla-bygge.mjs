// Kontrollerar att produktionsbygget (dist/) inte innehåller testläget eller skärmdumpsläget.
// Körs sist i "npm run build". Hoppas över i webbtestbygget (VITE_TESTLAGE=1, GitHub Pages).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

if (process.env.VITE_TESTLAGE === '1') {
  console.log('Byggkontroll: webbtestbygge (VITE_TESTLAGE=1) – testläget får finnas.');
  process.exit(0);
}
const MARKORER = ['TESTLÄGE', 'SKÄRMDUMPSLÄGE'];
const MAPP = 'dist/assets';
const fynd = readdirSync(MAPP)
  .filter((f) => f.endsWith('.js'))
  .flatMap((f) => MARKORER.filter((m) => readFileSync(join(MAPP, f), 'utf8').includes(m)).map((m) => `${f}: ${m}`));
if (fynd.length) {
  console.error('Byggkontroll: testkod hittades i produktionsbygget:\n  ' + fynd.join('\n  '));
  process.exit(1);
}
console.log('Byggkontroll: produktionsbygget saknar testläge och skärmdumpsläge.');
