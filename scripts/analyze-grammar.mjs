// Marcadores gramaticais e de estilo por nível (ocorrências por 1000 palavras).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const readers = JSON.parse(readFileSync(join(DATA, 'readers.json'), 'utf8'));

const MARKERS = {
  'pres. simples (he/she/it+s)': /\b(?:he|she|it|[A-Z][a-z]+)\s+\w+s\b/g,
  'passado simples (was/were)': /\b(?:was|were)\b/gi,
  'pass. comum (did/went/said/told)': /\b(?:did|went|said|told|came|saw|got|made|took)\b/gi,
  'futuro will': /\bwill\b/gi,
  'going to': /\bgoing to\b/gi,
  'pres. perfeito (have/has + pp)': /\b(?:have|has)\s+(?:\w+ed|been|done|gone|seen|made|taken|told)\b/gi,
  'pass. perfeito (had + pp)': /\bhad\s+(?:\w+ed|been|done|gone|seen|made|taken|told|run|left)\b/gi,
  'would (habitual/cond)': /\bwould\b/gi,
  could: /\bcould\b/gi,
  should: /\bshould\b/gi,
  might: /\bmight\b/gi,
  must: /\bmust\b/gi,
  'progressivo (was/were+ing)': /\b(?:was|were)\s+\w+ing\b/gi,
  'voz passiva (was/were + pp by?)': /\b(?:was|were)\s+(?:\w+ed|born|made|taken|given|told|found)\b/gi,
  'condicional if': /\bif\b/gi,
  'rel. who/which/that': /\b(?:who|which)\b/gi,
  'conect. avançados (although/however/despite)': /\b(?:although|however|despite|therefore|moreover|nevertheless|whereas)\b/gi,
  'phrasal (look/give/take/get + part.)': /\b(?:look|give|take|get|come|go|put|turn)(?:s|ed)?\s+(?:up|down|out|away|back|over|off|on)\b/gi,
  'discurso direto (aspas)': /[“"]/g,
};

const byLevel = new Map();
for (const r of readers) {
  const content = JSON.parse(readFileSync(join(DATA, 'content', `${r.id}.json`), 'utf8'));
  const text = content.tokens.map((t) => t.text).join('');
  const words = (text.match(/[a-zà-ɏ’']+/gi) ?? []).length;
  const counts = byLevel.get(r.level) ?? { words: 0, marks: {} };
  counts.words += words;
  for (const [name, re] of Object.entries(MARKERS)) {
    counts.marks[name] = (counts.marks[name] ?? 0) + (text.match(re) ?? []).length;
  }
  byLevel.set(r.level, counts);
}

const levels = [...byLevel.keys()].sort((a, b) => a - b);
console.log('marcador (por 1000 palavras) | ' + levels.map((l) => 'N' + l).join(' | '));
for (const name of Object.keys(MARKERS)) {
  const row = levels.map((l) => {
    const c = byLevel.get(l);
    return ((1000 * c.marks[name]) / c.words).toFixed(1);
  });
  console.log(`${name} | ${row.join(' | ')}`);
}
