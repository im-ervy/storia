// Monta os graded readers em italiano a partir das seções anotadas:
// valida lossless contra o texto-fonte, gera data/content/<id>.json e
// reconstrói o catálogo data/readers-it.json. (cópia do assemble-es.mjs)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const IT = join(DATA, 'it');

// Registro dos livros italianos (acrescente aqui os próximos). Faixa de id 60001+.
const BOOKS = [
  {
    id: 60001,
    slug: 'il-bambino-che-non-sapeva-dire-la-verita',
    title: 'Il Bambino Che Non Sapeva Dire La Verità',
    sectionPrefix: '_60001-section-',
    sections: 4,
    coverUrl: '/covers/23-covers.png',
  },
  {
    id: 60002,
    slug: 'il-posto-felice',
    title: 'Il Posto Felice',
    sectionPrefix: '_60002-section-',
    sections: 4,
    coverUrl: '/covers/25-covers.png',
  },
  {
    id: 60003,
    slug: 'la-levatrice',
    title: 'La Levatrice',
    sectionPrefix: '_60003-section-',
    sections: 4,
    coverUrl: '/covers/17-covers.png',
  },
  {
    id: 60004,
    slug: 'le-domande-di-anna',
    title: 'Le Domande di Anna',
    sectionPrefix: '_60004-section-',
    sections: 4,
    coverUrl: '/covers/26-covers.png',
  },
  {
    id: 60005,
    slug: 'cuore-freddo',
    title: 'Cuore Freddo',
    sectionPrefix: '_60005-section-',
    sections: 4,
    coverUrl: '/covers/11-covers.png',
  },
];

const WORD_RE = /[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi;
const catalogue = [];

for (const book of BOOKS) {
  const sectionFiles = Array.from(
    { length: book.sections },
    (_, i) => join(IT, `${book.sectionPrefix}${i + 1}.json`)
  );
  if (!sectionFiles.every((f) => existsSync(f))) {
    console.log(`(${book.slug}: seções incompletas — pulado)`);
    continue;
  }
  const source = readFileSync(join(IT, `${book.slug}.txt`), 'utf8');
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
    level: book.level ?? 1,
    coverUrl: book.coverUrl,
    position: 0,
    times: 0,
    listeningTimes: 0,
    narrator: 'Giulia',
    audioDuration: Math.round((words.length / 130) * 10) / 10,
    published: true,
    // Espelha o original: só os 3 primeiros readers do nível são tryout.
    tryout: book.id <= 60003,
    score: null,
    uniqueWordsNumber: uniq.size,
    lang: 'it',
  });

  console.log(
    `${book.slug}: OK lossless ✓ | tokens ${tokens.length} | trad ${withTr} | tips ${withTips} | expl ${expl} | palavras ${words.length} | unicas ${uniq.size} | TTR ${(uniq.size / words.length).toFixed(2)}`
  );
}

writeFileSync(join(DATA, 'readers-it.json'), JSON.stringify(catalogue, null, 0));
console.log(`catalogo it: ${catalogue.length} livros`);
