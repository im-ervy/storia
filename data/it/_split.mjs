// Divide um livro italiano em 4 seções balanceadas POR PALAVRAS (em fronteiras
// de parágrafo), gerando data/it/_<id>-section-{1..4}.txt para os agentes.
// Uso: node data/it/_split.mjs <id> <slug>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , id, slug] = process.argv;
if (!id || !slug) {
  console.error('uso: node data/it/_split.mjs <id> <slug>');
  process.exit(1);
}
const IT = join(process.cwd(), 'data', 'it');
const WORD = /[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi;

const source = readFileSync(join(IT, `${slug}.txt`), 'utf8');
const paragraphs = source
  .split(/\r?\n\r?\n+/)
  .map((p) => p.trim().replace(/\r?\n/g, ' '))
  .filter(Boolean);

const counts = paragraphs.map((p) => (p.match(WORD) ?? []).length);
const total = counts.reduce((a, b) => a + b, 0);
const target = total / 4;

const groups = [[], [], [], []];
let g = 0,
  acc = 0;
for (let i = 0; i < paragraphs.length; i++) {
  groups[g].push(paragraphs[i]);
  acc += counts[i];
  // fecha a seção quando passa do alvo acumulado (mas nunca a 4ª antes do fim)
  if (g < 3 && acc >= target * (g + 1)) g++;
}

groups.forEach((grp, i) => {
  const text = grp.join('\n\n');
  const file = join(IT, `_${id}-section-${i + 1}.txt`);
  writeFileSync(file, text, 'utf8');
  const w = (text.match(WORD) ?? []).length;
  console.log(`_${id}-section-${i + 1}.txt: ${grp.length} parag., ${w} palavras`);
});
console.log(`total: ${paragraphs.length} parag., ${total} palavras (alvo/seção ~${Math.round(target)})`);
