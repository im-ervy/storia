// Monta os "Real Books" (nível 9): livros AUTÊNTICOS em inglês (não-graded),
// anotados com a mesma metodologia dos graded readers. Valida lossless contra
// o texto-fonte, gera data/content/<id>.json e reconstrói data/readers-realbooks.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const RB = join(DATA, 'realbooks');

// Registro dos real books (acrescente aqui os próximos livros/capítulos).
const BOOKS = [
  {
    id: 90001,
    slug: 'percy-jackson-the-lightning-thief',
    title: 'Percy Jackson & the Lightning Thief — Ch. 1',
    sectionPrefix: '_90001-section-',
    sections: 4,
    coverUrl: '/covers/90001-cover.jpg',
    level: 9,
    narrator: 'Natalie',
  },
  {
    id: 90002,
    slug: 'percy-jackson-the-lightning-thief-ch2',
    title: 'Percy Jackson & the Lightning Thief — Ch. 2',
    sectionPrefix: '_90002-section-',
    sections: 4,
    coverUrl: '/covers/90001-cover.jpg',
    level: 9,
    narrator: 'Natalie',
  },
];

const WORD_RE = /[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi;
const catalogue = [];

for (const book of BOOKS) {
  const sectionFiles = Array.from(
    { length: book.sections },
    (_, i) => join(RB, `${book.sectionPrefix}${i + 1}.json`)
  );
  if (!sectionFiles.every((f) => existsSync(f))) {
    console.log(`(${book.slug}: seções incompletas — pulado)`);
    continue;
  }
  const source = readFileSync(join(RB, `${book.slug}.txt`), 'utf8');
  const paragraphs = source
    .split(/\r?\n\r?\n+/)
    .map((p) => p.trim().replace(/\r?\n/g, ' '))
    .filter(Boolean);
  const expected = paragraphs.join('');

  const tokens = [];
  for (const f of sectionFiles) tokens.push(...JSON.parse(readFileSync(f, 'utf8')));

  // Normalização defensiva + validações
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
    level: book.level ?? 9,
    coverUrl: book.coverUrl,
    position: 0,
    times: 0,
    listeningTimes: 0,
    narrator: book.narrator ?? 'Natalie',
    audioDuration: Math.round((words.length / 130) * 10) / 10,
    published: true,
    tryout: false,
    score: null,
    uniqueWordsNumber: uniq.size,
    lang: 'en',
  });

  console.log(
    `${book.slug}: OK lossless ✓ | tokens ${tokens.length} | trad ${withTr} | tips ${withTips} | expl ${expl} | palavras ${words.length} | unicas ${uniq.size} | TTR ${(uniq.size / words.length).toFixed(2)}`
  );
}

writeFileSync(join(DATA, 'readers-realbooks.json'), JSON.stringify(catalogue, null, 0));
console.log(`catalogo real books: ${catalogue.length} livros`);
