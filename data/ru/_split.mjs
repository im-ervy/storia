// Divide um texto-fonte ru em 4 seções balanceadas POR PALAVRAS (não por nº de
// parágrafos — o diálogo curto desbalanceia). Uso:
//   node data/ru/_split.mjs <id> <slug>
// Gera data/ru/_<id>-section-{1..4}.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [id, slug] = process.argv.slice(2);
if (!id || !slug) {
  console.error('uso: node data/ru/_split.mjs <id> <slug>');
  process.exit(1);
}
const RU = join(process.cwd(), 'data', 'ru');
const src = readFileSync(join(RU, `${slug}.txt`), 'utf8');
const paras = src.split(/\r?\n\r?\n+/).map((p) => p.trim()).filter(Boolean);
const wc = (s) => (s.toLowerCase().match(/[а-яё]+/g) || []).length;
const total = paras.reduce((a, p) => a + wc(p), 0);
const target = total / 4;

const sections = [[], [], [], []];
let si = 0;
let acc = 0;
for (let i = 0; i < paras.length; i++) {
  sections[si].push(paras[i]);
  acc += wc(paras[i]);
  // fecha a seção quando passa do alvo cumulativo e ainda restam parágrafos p/ as próximas
  const remainingParas = paras.length - 1 - i;
  const remainingSecs = 3 - si;
  if (si < 3 && acc >= target * (si + 1) && remainingParas > remainingSecs) {
    si++;
  }
}
for (let s = 0; s < 4; s++) {
  const text = sections[s].join('\n\n');
  writeFileSync(join(RU, `_${id}-section-${s + 1}.txt`), text + '\n');
  console.log(`seção ${s + 1}: ${sections[s].length} parág., ${wc(text)} palavras`);
}
