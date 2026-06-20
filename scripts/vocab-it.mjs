// Vocabulário acumulado da coleção italiana: união, reciclagem entre livros
// e decomposição (elisões, nomes próprios, estimativa de lemas). (cópia do fr)
import { readFileSync } from 'node:fs';

const WORD = /[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi;
const books = [60001, 60002, 60003, 60004, 60005];
const sets = [];
const union = new Set();
const freq = new Map();

for (const id of books) {
  const c = JSON.parse(readFileSync(`data/content/${id}.json`, 'utf8'));
  const ws = c.tokens.map((t) => t.text).join('').toLowerCase().match(WORD) ?? [];
  const s = new Set(ws);
  sets.push(s);
  for (const w of ws) freq.set(w, (freq.get(w) ?? 0) + 1);
  for (const w of s) union.add(w);
}

console.log('unicas por livro:', sets.map((s) => s.size).join(', '));
console.log('UNIAO (acumulado):', union.size);

for (let i = 1; i < sets.length; i++) {
  const prev = new Set(sets.slice(0, i).flatMap((s) => [...s]));
  const overlap = [...sets[i]].filter((w) => prev.has(w)).length;
  console.log(
    `livro ${i + 1}: ${sets[i].size} unicas, ${overlap} recicladas (${Math.round((100 * overlap) / sets[i].size)}%)`
  );
}

const contracted = [...union].filter((w) => /['’]/.test(w));
console.log('formas com apostrofo (elisoes tipo c-era, dell-acqua):', contracted.length);
const stems = new Set([...union].map((w) => w.replace(/['’].*/, '').slice(0, 5)));
console.log('radicais distintos (proxy de familias de palavras):', stems.size);
const hapax = [...union].filter((w) => freq.get(w) === 1).length;
console.log(`hapax na colecao: ${hapax} (${Math.round((100 * hapax) / union.size)}%)`);
console.log(`media de ocorrencias por palavra unica: ${([...freq.values()].reduce((a, b) => a + b, 0) / union.size).toFixed(1)}x`);
