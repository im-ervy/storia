// Análise quantitativa dos 195 graded readers, por nível.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const readers = JSON.parse(readFileSync(join(DATA, 'readers.json'), 'utf8'));

const WORD_RE = /[a-zà-ɏ]+(?:['’][a-z]+)?/gi;

const byLevel = new Map();
const vocabByLevel = new Map();

for (const r of readers) {
  const content = JSON.parse(readFileSync(join(DATA, 'content', `${r.id}.json`), 'utf8'));
  const tokens = content.tokens;
  const text = tokens.map((t) => t.text).join('');
  const words = (text.toLowerCase().match(WORD_RE) ?? []);
  const uniq = new Set(words);

  // Frases (pontuação final)
  const sentences = text.split(/[.!?]+[\s"”']/).filter((s) => s.trim().length > 2);
  const sentLens = sentences.map((s) => (s.match(WORD_RE) ?? []).length).filter((n) => n > 0);

  // Chunks de tradução (tokens com translation)
  const transTokens = tokens.filter((t) => t.translation);
  const chunkLens = transTokens.map((t) => (t.text.match(WORD_RE) ?? []).length).filter((n) => n > 0);
  const withTips = transTokens.filter((t) => t.translation.tips?.length > 0);
  const explanations = transTokens.flatMap((t) => t.translation.tips ?? []).filter((x) => x.explanation);

  // Diálogo: parágrafos com aspas
  const paragraphs = [];
  let cur = [];
  for (const t of tokens) { if (t.newLine && cur.length) { paragraphs.push(cur.map(x=>x.text).join('')); cur = []; } cur.push(t); }
  if (cur.length) paragraphs.push(cur.map(x=>x.text).join(''));
  const dialogueParas = paragraphs.filter((p) => /[“"]/.test(p));

  const stats = byLevel.get(r.level) ?? {
    books: 0, words: [], uniq: [], sentLen: [], chunkLen: [], paraWords: [],
    tipsPct: [], explPerBook: [], dialoguePct: [], paras: [], audioMin: [],
  };
  stats.books++;
  stats.words.push(words.length);
  stats.uniq.push(uniq.size);
  stats.sentLen.push(...sentLens);
  stats.chunkLen.push(...chunkLens);
  stats.tipsPct.push((100 * withTips.length) / Math.max(1, transTokens.length));
  stats.explPerBook.push(explanations.length);
  stats.dialoguePct.push((100 * dialogueParas.length) / Math.max(1, paragraphs.length));
  stats.paras.push(paragraphs.length);
  stats.paraWords.push(words.length / Math.max(1, paragraphs.length));
  stats.audioMin.push(r.audioDuration);
  byLevel.set(r.level, stats);

  const vocab = vocabByLevel.get(r.level) ?? new Set();
  for (const w of uniq) vocab.add(w);
  vocabByLevel.set(r.level, vocab);
}

const avg = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const p90 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * 0.9)]; };
const fmt = (n, d = 1) => n.toFixed(d);

console.log('nivel | livros | palavras (med, min-max) | unicas (med) | TTR | frase med/p90 | chunk med | %tips | expl/livro | %dialogo | parags | par/palavras | audio min');
for (const [lvl, s] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
  const wmin = Math.min(...s.words), wmax = Math.max(...s.words);
  const ttr = avg(s.uniq.map((u, i) => u / s.words[i]));
  console.log(
    `${lvl} | ${s.books} | ${med(s.words)} (${wmin}-${wmax}) | ${med(s.uniq)} | ${fmt(ttr, 2)} | ${fmt(avg(s.sentLen))}/${p90(s.sentLen)} | ${fmt(avg(s.chunkLen))} | ${fmt(avg(s.tipsPct), 0)}% | ${fmt(avg(s.explPerBook), 1)} | ${fmt(avg(s.dialoguePct), 0)}% | ${fmt(avg(s.paras), 0)} | ${fmt(avg(s.paraWords), 0)} | ${fmt(avg(s.audioMin), 1)}`
  );
}

// Progressão de vocabulário: cumulativo e novidade por nível
console.log('\nvocabulario: nivel | vocab do nivel | acumulado | % novo vs niveis anteriores');
const seen = new Set();
for (const [lvl, vocab] of [...vocabByLevel.entries()].sort((a, b) => a[0] - b[0])) {
  const novel = [...vocab].filter((w) => !seen.has(w)).length;
  for (const w of vocab) seen.add(w);
  console.log(`${lvl} | ${vocab.size} | ${seen.size} | ${fmt((100 * novel) / vocab.size, 0)}%`);
}

// Cobertura do vocabulário de cada nível pelos N1-anteriores (reuso)
console.log('\ntop 25 palavras exclusivas de cada nivel (nao usadas em niveis anteriores):');
const seen2 = new Set();
for (const [lvl, vocab] of [...vocabByLevel.entries()].sort((a, b) => a[0] - b[0])) {
  const novel = [...vocab].filter((w) => !seen2.has(w));
  for (const w of vocab) seen2.add(w);
  if (lvl > 1) console.log(`N${lvl}: ${novel.slice(0, 25).join(', ')}`);
}
