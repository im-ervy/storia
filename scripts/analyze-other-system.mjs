// Métricas do outro sistema (graded-readers multi-idioma) nos mesmos moldes
// da análise do corpus Mairo, por idioma+nível.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'C:/Users/{user}/projetos/meus/graded-readers/src/content';
const LANGS = ['frances', 'espanhol', 'mandarim', 'russo'];

const stats = [];
for (const lang of LANGS) {
  const langDir = join(BASE, lang);
  for (const lvl of readdirSync(langDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const files = readdirSync(join(langDir, lvl.name)).filter((f) => f.endsWith('.json'));
    const agg = { lang, level: lvl.name, books: 0, words: [], uniq: [], sentLen: [], dialog: [], exprPct: [], paras: [] };
    for (const f of files) {
      const j = JSON.parse(readFileSync(join(langDir, lvl.name, f), 'utf8'));
      const paras = j.paragraphs ?? [];
      const segs = paras.flatMap((p) => p.segments ?? []);
      const isZh = lang === 'mandarim';
      const wordSegs = segs.filter((s) => s.k === 'w' || s.k === 'e');
      const text = segs.map((s) => s.s).join('');
      // contagem de palavras: segmentos w/e (zh: caracteres han)
      const words = isZh
        ? (text.match(/\p{Script=Han}/gu) ?? []).map((c) => c)
        : wordSegs.flatMap((s) => s.s.toLowerCase().split(/[\s'']+/).filter(Boolean));
      const uniq = new Set(words);
      const sentences = text.split(/[.!?。！？]+/).filter((s) => s.trim().length > 1);
      const sentLens = sentences
        .map((s) => (isZh ? (s.match(/\p{Script=Han}/gu) ?? []).length : (s.match(/[\p{L}'']+/gu) ?? []).length))
        .filter((n) => n > 0);
      const dialogParas = paras.filter((p) => /[«"“—”]/.test((p.segments ?? []).map((s) => s.s).join('')));
      agg.books++;
      agg.words.push(words.length);
      agg.uniq.push(uniq.size);
      agg.sentLen.push(...sentLens);
      agg.dialog.push((100 * dialogParas.length) / Math.max(1, paras.length));
      agg.exprPct.push((100 * segs.filter((s) => s.k === 'e').length) / Math.max(1, wordSegs.length));
      agg.paras.push(paras.length);
    }
    stats.push(agg);
  }
}

const avg = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
const fmt = (n, d = 1) => Number(n).toFixed(d);

console.log('idioma/nivel | livros | palavras med | unicas med | TTR | frase med | %dialogo | %expressoes | parags');
for (const s of stats) {
  if (!s.books) continue;
  const ttr = avg(s.uniq.map((u, i) => u / Math.max(1, s.words[i])));
  console.log(
    `${s.lang}/${s.level} | ${s.books} | ${med(s.words)} | ${med(s.uniq)} | ${fmt(ttr, 2)} | ${fmt(avg(s.sentLen))} | ${fmt(avg(s.dialog), 0)}% | ${fmt(avg(s.exprPct), 0)}% | ${fmt(avg(s.paras), 0)}`
  );
}
