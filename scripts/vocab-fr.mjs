// Vocabulário acumulado da coleção francesa: união, reciclagem entre livros
// e decomposição (contrações, nomes próprios, estimativa de lemas).
import { readFileSync } from 'node:fs';

const WORD = /[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi;
const books = [10001, 10002, 10003, 10004, 10005, 10006, 10007, 10008, 10009, 10010, 10011, 10012, 10013, 10014, 10015, 10016, 10017, 10018, 10019, 10020, 10021, 10022, 10023, 10024, 10025, 10026, 10027, 10028, 10029, 10030, 10031, 10032, 10033, 10034, 10035, 10036, 10037, 10038, 10039, 10040, 10041, 10042, 10043, 10044, 10045, 10046, 10047, 10048, 10049, 10050, 10051, 10052, 10053, 10054, 10055, 10056, 10057, 10058, 10059, 10060, 10061, 10062, 10063, 10064, 10065, 10066, 10067, 10068, 10069, 10070, 10071, 10072, 10073, 10074, 10075, 10076, 10077, 10078, 10079, 10080, 10081, 10082, 10083, 10084, 10085, 10086, 10087, 10088, 10089, 10090, 10091, 10092, 10093, 10094, 10095, 10096, 10097, 10098, 10099, 10100, 10101, 10102, 10103, 10104, 10105];
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

// Decomposição da união
const contracted = [...union].filter((w) => /['’]/.test(w));
const properish = ['rousse', 'bleu', 'étoile', 'soleil', 'été', 'pierre', 'vert', 'camille'];
console.log('formas com apostrofo (contracoes tipo j-ai, c-est):', contracted.length);

// Estimativa grosseira de "famílias": agrupar por radical (5 primeiras letras)
const stems = new Set([...union].map((w) => w.replace(/['’].*/, '').slice(0, 5)));
console.log('radicais distintos (proxy de familias de palavras):', stems.size);

// Palavras que aparecem só 1x em toda a coleção (exposição fraca)
const hapax = [...union].filter((w) => freq.get(w) === 1).length;
console.log(`hapax na colecao (1 ocorrencia em 3 livros): ${hapax} (${Math.round((100 * hapax) / union.size)}%)`);
console.log(`media de ocorrencias por palavra unica na colecao: ${([...freq.values()].reduce((a, b) => a + b, 0) / union.size).toFixed(1)}x`);
