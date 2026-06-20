// Cobertura lexical (% do texto coberto pelas N palavras mais frequentes do
// corpus) e amostras de explicações pedagógicas por nível.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const readers = JSON.parse(readFileSync(join(DATA, 'readers.json'), 'utf8'));
const WORD_RE = /[a-zà-ɏ]+(?:['’][a-z]+)?/gi;

// Frequência global do corpus
const freq = new Map();
const levelTexts = new Map();
for (const r of readers) {
  const content = JSON.parse(readFileSync(join(DATA, 'content', `${r.id}.json`), 'utf8'));
  const arr = levelTexts.get(r.level) ?? [];
  arr.push(content.tokens);
  levelTexts.set(r.level, arr);
  for (const w of content.tokens.map((t) => t.text).join('').toLowerCase().match(WORD_RE) ?? []) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
}
const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);
const bands = [100, 300, 600, 1000, 2000];

console.log('cobertura do texto pelas top-N palavras do corpus:');
console.log('nivel | ' + bands.map((b) => `top${b}`).join(' | '));
for (const [lvl, books] of [...levelTexts.entries()].sort((a, b) => a[0] - b[0])) {
  const words = books.flatMap((toks) => toks.map((t) => t.text).join('').toLowerCase().match(WORD_RE) ?? []);
  const row = bands.map((b) => {
    const set = new Set(ranked.slice(0, b));
    const covered = words.filter((w) => set.has(w)).length;
    return ((100 * covered) / words.length).toFixed(1) + '%';
  });
  console.log(`${lvl} | ${row.join(' | ')}`);
}

console.log('\namostras de explicacoes (tips.explanation) por nivel:');
for (const [lvl, books] of [...levelTexts.entries()].sort((a, b) => a[0] - b[0])) {
  const expl = [];
  for (const toks of books) {
    for (const t of toks) {
      for (const tip of t.translation?.tips ?? []) {
        if (tip.explanation) expl.push(`[${tip.text} -> ${tip.translatedText}] ${tip.explanation}`);
      }
    }
  }
  console.log(`\nN${lvl} (${expl.length} explicacoes no nivel):`);
  // 3 amostras espaçadas
  for (const i of [0, Math.floor(expl.length / 2), expl.length - 1]) {
    if (expl[i]) console.log('  - ' + expl[i].slice(0, 220));
  }
}
