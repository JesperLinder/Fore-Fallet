// Kontrollerar textlängderna i store/beskrivning.md mot App Store Connects gränser.
// Kör: node scripts/kolla-store.mjs
import { readFileSync } from 'node:fs';

const GRANSER = { Namn: 30, Underrubrik: 30, Sökord: 100, Beskrivning: 4000 };
const md = readFileSync('store/beskrivning.md', 'utf8');
let fel = 0;
for (const [rubrik, max] of Object.entries(GRANSER)) {
  const m = md.match(new RegExp(`## ${rubrik}[^\\n]*\\n+\`\`\`\\n([\\s\\S]*?)\\n\`\`\``));
  if (!m) {
    console.error(`${rubrik}: hittades inte`);
    fel++;
    continue;
  }
  const antal = [...m[1]].length;
  const ok = antal <= max;
  if (!ok) fel++;
  console.log(`${ok ? 'OK ' : 'FÖR LÅNG'} ${rubrik}: ${antal} av högst ${max} tecken`);
}
process.exit(fel ? 1 : 0);
