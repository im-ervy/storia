// Divide data/fr/<slug>.txt em 4 seções balanceadas por palavras (respeita parágrafos).
// Usa pontos de corte por posição cumulativa (minimiza desequilíbrio).
// uso: node scripts/split-sections.mjs <slug> <id>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [slug, id] = process.argv.slice(2);
if (!slug || !id) {
  console.error('uso: node scripts/split-sections.mjs <slug> <id>');
  process.exit(1);
}
const FR = join(process.cwd(), 'data', 'fr');
const WORD = /[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi;
const text = readFileSync(join(FR, `${slug}.txt`), 'utf8');
const paras = text.split(/\r?\n\r?\n+/).map((p) => p.trim()).filter(Boolean);
const wc = (s) => (s.toLowerCase().match(WORD) || []).length;
const counts = paras.map(wc);
const total = counts.reduce((a, b) => a + b, 0);

// cumulativo após cada parágrafo
const cum = [];
let run = 0;
for (const c of counts) { run += c; cum.push(run); }

// escolhe, para os cortes 1/4, 2/4, 3/4, a fronteira de parágrafo mais próxima
const cuts = [];
for (let k = 1; k <= 3; k++) {
  const goal = (total * k) / 4;
  let best = 0, bestErr = Infinity;
  for (let i = 0; i < paras.length - 1; i++) {
    const err = Math.abs(cum[i] - goal);
    if (err < bestErr && (cuts.length === 0 || i + 1 > cuts[cuts.length - 1])) {
      bestErr = err; best = i + 1; // best = índice do 1º parágrafo da próxima seção
    }
  }
  cuts.push(best);
}

const bounds = [0, ...cuts, paras.length];
for (let n = 0; n < 4; n++) {
  const slice = paras.slice(bounds[n], bounds[n + 1]);
  const body = slice.join('\n\n');
  writeFileSync(join(FR, `_${id}-section-${n + 1}.txt`), body + '\n', 'utf8');
  console.log(`seção ${n + 1}: ${wc(body)} palavras, ${slice.length} parágrafos`);
}
console.log(`total: ${total} palavras`);
