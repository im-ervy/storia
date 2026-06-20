// Divide a fonte data/es/<slug>.txt em 4 seções balanceadas POR PALAVRAS,
// gerando data/es/_<id>-section-{1..4}.txt (parágrafos separados por linha em branco).
// Uso: node data/es/_split.mjs <id> <slug>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ES = dirname(fileURLToPath(import.meta.url));
const [id, slug] = process.argv.slice(2);
if (!id || !slug) {
  console.error('uso: node data/es/_split.mjs <id> <slug>');
  process.exit(1);
}

const src = readFileSync(join(ES, `${slug}.txt`), 'utf8');
const paras = src.split(/\r?\n\r?\n+/).map((p) => p.trim().replace(/\r?\n/g, ' ')).filter(Boolean);
const wc = (p) => (p.match(/[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi) || []).length;
const total = paras.reduce((a, p) => a + wc(p), 0);
const target = total / 4;

const sections = [[], [], [], []];
let si = 0, acc = 0;
for (let i = 0; i < paras.length; i++) {
  sections[si].push(paras[i]);
  acc += wc(paras[i]);
  // fecha a seção quando passa o alvo cumulativo, mas deixa parágrafos para as restantes
  const remainingParas = paras.length - 1 - i;
  const remainingSecs = 3 - si;
  if (si < 3 && acc >= target * (si + 1) && remainingParas > remainingSecs) {
    si++;
  }
}

sections.forEach((secParas, i) => {
  const out = secParas.join('\n\n');
  writeFileSync(join(ES, `_${id}-section-${i + 1}.txt`), out + '\n', 'utf8');
  console.log(`section ${i + 1}: ${secParas.length} parágrafos, ${secParas.reduce((a, p) => a + wc(p), 0)} palavras`);
});
