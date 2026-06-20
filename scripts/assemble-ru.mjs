// Monta os graded readers de russo a partir das seções anotadas:
// valida lossless contra o texto-fonte, gera data/content/<id>.json e
// reconstrói o catálogo data/readers-ru.json.
//
// Como o francês, o russo tem espaços entre palavras: os parágrafos são unidos
// com '' (a quebra fica marcada por newLine:true) e as métricas contam palavras
// cirílicas. A transliteração com acento tônico vive em translation.text/tips.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const RU = join(DATA, 'ru');

// Registro dos livros de russo (faixa de ids 30001+).
const BOOKS = [
  {
    id: 30001,
    slug: 'malchik-kotoryy-ne-govoril-pravdu',
    title: 'Мальчик, который не говорил правду',
    sectionPrefix: '_30001-section-',
    sections: 4,
    coverUrl: '/covers/23-covers.png', // mesmo original EN do fr 10001 / zh 20001
  },
  {
    id: 30002,
    slug: 'schastlivoe-mesto',
    title: 'Счастливое Место',
    sectionPrefix: '_30002-section-',
    sections: 4,
    coverUrl: '/covers/25-covers.png', // EN #2 The Happy Place
  },
  {
    id: 30003,
    slug: 'povitukha',
    title: 'Повитуха',
    sectionPrefix: '_30003-section-',
    sections: 4,
    coverUrl: '/covers/17-covers.png', // EN #3 The Midwife
  },
  {
    id: 30004,
    slug: 'voprosy-anny',
    title: 'Вопросы Анны',
    sectionPrefix: '_30004-section-',
    sections: 4,
    coverUrl: '/covers/26-covers.png', // EN #4 Anna's Questions
  },
  {
    id: 30005,
    slug: 'kholodnoe-serdtse',
    title: 'Холодное Сердце',
    sectionPrefix: '_30005-section-',
    sections: 4,
    coverUrl: '/covers/11-covers.png', // EN #5 Cold Heart
  },
];

const WORD_RE = /[а-яё]+/gi;
const catalogue = [];

for (const book of BOOKS) {
  const sectionFiles = Array.from(
    { length: book.sections },
    (_, i) => join(RU, `${book.sectionPrefix}${i + 1}.json`)
  );
  if (!sectionFiles.every((f) => existsSync(f))) {
    console.log(`(${book.slug}: seções incompletas — pulado)`);
    continue;
  }
  const source = readFileSync(join(RU, `${book.slug}.txt`), 'utf8');
  const paragraphs = source
    .split(/\r?\n\r?\n+/)
    .map((p) => p.trim().replace(/\r?\n/g, ' '))
    .filter(Boolean);
  const expected = paragraphs.join('');

  const tokens = [];
  for (const f of sectionFiles) tokens.push(...JSON.parse(readFileSync(f, 'utf8')));

  for (const t of tokens) {
    if (t.translation && !Array.isArray(t.translation.tips)) t.translation.tips = [];
  }
  const concat = tokens.map((t) => t.text).join('');
  if (concat !== expected) {
    let d = 0;
    while (d < Math.min(concat.length, expected.length) && concat[d] === expected[d]) d++;
    console.error(`${book.slug}: LOSSLESS FALHOU no char ${d}:`);
    console.error('  esperado: ' + JSON.stringify(expected.slice(Math.max(0, d - 40), d + 40)));
    console.error('  obtido:   ' + JSON.stringify(concat.slice(Math.max(0, d - 40), d + 40)));
    process.exit(1);
  }
  const newLines = tokens.filter((t) => t.newLine).length;
  if (newLines !== paragraphs.length) {
    console.error(`${book.slug}: paragrafos esperado ${paragraphs.length}, obtido ${newLines}`);
    process.exit(1);
  }

  writeFileSync(
    join(DATA, 'content', `${book.id}.json`),
    JSON.stringify({ id: book.id, total: tokens.length, tokens }, null, 0)
  );

  const words = expected.toLowerCase().match(WORD_RE) ?? [];
  const uniq = new Set(words);
  const withTr = tokens.filter((t) => t.translation).length;
  const withTips = tokens.filter((t) => t.translation?.tips?.length > 0).length;
  const expl = tokens
    .flatMap((t) => t.translation?.tips ?? [])
    .filter((x) => x.explanation).length;

  catalogue.push({
    id: book.id,
    title: book.title,
    sampleText: expected.slice(0, 400),
    level: book.level ?? 1,
    coverUrl: book.coverUrl,
    position: 0,
    times: 0,
    listeningTimes: 0,
    narrator: 'Olga',
    audioDuration: Math.round((words.length / 130) * 10) / 10,
    published: true,
    tryout: book.id <= 30003,
    score: null,
    uniqueWordsNumber: uniq.size,
    lang: 'ru',
  });

  console.log(
    `${book.slug}: OK lossless ✓ | tokens ${tokens.length} | trad ${withTr} | tips ${withTips} | expl ${expl} | palavras ${words.length} | unicas ${uniq.size} | TTR ${(uniq.size / words.length).toFixed(2)}`
  );
}

writeFileSync(join(DATA, 'readers-ru.json'), JSON.stringify(catalogue, null, 0));
console.log(`catalogo ru: ${catalogue.length} livros`);
