// Divide um texto FR em 4 seções balanceadas POR PALAVRAS, respeitando
// fronteiras de parágrafo. Uso: node scripts/split-fr.mjs <id> <slug>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , id, slug] = process.argv;
if (!id || !slug) {
  console.error('uso: node scripts/split-fr.mjs <id> <slug>');
  process.exit(1);
}
const FR = join(process.cwd(), 'data', 'fr');
const WORD_RE = /[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi;

const src = readFileSync(join(FR, `${slug}.txt`), 'utf8');
const paras = src
  .split(/\r?\n\r?\n+/)
  .map((p) => p.trim().replace(/\r?\n/g, ' '))
  .filter(Boolean);

const counts = paras.map((p) => (p.toLowerCase().match(WORD_RE) ?? []).length);
const total = counts.reduce((a, b) => a + b, 0);
const target = total / 4;

// Atribui parágrafos a 4 baldes, fechando um balde quando passa do alvo
const sections = [[], [], [], []];
let s = 0;
let acc = 0;
for (let i = 0; i < paras.length; i++) {
  sections[s].push(paras[i]);
  acc += counts[i];
  const remainingParas = paras.length - 1 - i;
  const remainingSlots = 3 - s;
  // fecha o balde se já passou do alvo e ainda sobram parágrafos p/ os baldes restantes
  if (s < 3 && acc >= target * (s + 1) && remainingParas > remainingSlots) {
    s++;
  }
}

for (let i = 0; i < 4; i++) {
  const body = sections[i].join('\n\n');
  const w = (body.toLowerCase().match(WORD_RE) ?? []).length;
  writeFileSync(join(FR, `_${id}-section-${i + 1}.txt`), body, 'utf8');
  console.log(`section ${i + 1}: ${sections[i].length} parágrafos, ${w} palavras`);
}
