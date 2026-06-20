// Monta os graded readers de japonês a partir das seções anotadas:
// valida lossless contra o texto-fonte, gera data/content/<id>.json e
// reconstrói o catálogo data/readers-ja.json.
//
// Como o mandarim, o japonês NÃO tem espaços: os parágrafos são unidos com ''
// (a quebra fica marcada por newLine:true) e as métricas contam CARACTERES
// (kanji + hiragana + katakana), igual ao zh. O rōmaji (Hepburn) com vogais
// longas vive em translation.text/tips, antes do " — " (modo ruby/translit).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { addFurigana } from './furigana.mjs';

const DATA = join(process.cwd(), 'data');
const JA = join(DATA, 'ja');

// Registro dos livros de japonês (faixa de ids 40001+).
const BOOKS = [
  {
    id: 40001,
    slug: 'hontou-no-koto-ga-ienai-otokonoko',
    title: 'ほんとうのことが言えない男の子',
    sectionPrefix: '_40001-section-',
    sections: 4,
    coverUrl: '/covers/23-covers.png', // mesmo original EN do fr 10001 / zh 20001 / ru 30001
  },
  {
    id: 40002,
    slug: 'shiawase-no-basho',
    title: '幸せの場所',
    sectionPrefix: '_40002-section-',
    sections: 4,
    coverUrl: '/covers/25-covers.png', // EN #2 The Happy Place
  },
  {
    id: 40003,
    slug: 'sanba-san',
    title: '産婆さん',
    sectionPrefix: '_40003-section-',
    sections: 4,
    coverUrl: '/covers/17-covers.png', // EN #3 The Midwife
  },
  {
    id: 40004,
    slug: 'anna-no-shitsumon',
    title: 'アンナのしつもん',
    sectionPrefix: '_40004-section-',
    sections: 4,
    coverUrl: '/covers/26-covers.png', // EN #4 Anna's Questions
  },
  {
    id: 40005,
    slug: 'tsumetai-kokoro',
    title: '冷たい心',
    sectionPrefix: '_40005-section-',
    sections: 4,
    coverUrl: '/covers/11-covers.png', // EN #5 Cold Heart
  },
];

// Cada kanji/hiragana/katakana conta como uma "palavra" (mesma lógica do zh em
// data.ts). 々 (repetição) e ー (vogal longa katakana) incluídos.
const CHAR_RE = /[ぁ-ゖァ-ヺ一-鿿々ー]/g;
const catalogue = [];

for (const book of BOOKS) {
  const sectionFiles = Array.from(
    { length: book.sections },
    (_, i) => join(JA, `${book.sectionPrefix}${i + 1}.json`)
  );
  if (!sectionFiles.every((f) => existsSync(f))) {
    console.log(`(${book.slug}: seções incompletas — pulado)`);
    continue;
  }
  const source = readFileSync(join(JA, `${book.slug}.txt`), 'utf8');
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

  // Enriquece os tokens com furigana (leitura em hiragana acima dos kanji).
  const { count: furiCount, warnings } = await addFurigana(tokens);
  for (const w of warnings) console.warn(`  furigana: ${w}`);
  // Sanidade: a concatenação dos segmentos de furigana reproduz cada token.
  for (const t of tokens) {
    if (t.furigana && t.furigana.map((s) => s.t).join('') !== t.text) {
      console.error(`${book.slug}: furigana lossless FALHOU em ${JSON.stringify(t.text)}`);
      process.exit(1);
    }
  }

  writeFileSync(
    join(DATA, 'content', `${book.id}.json`),
    JSON.stringify({ id: book.id, total: tokens.length, tokens }, null, 0)
  );

  const chars = expected.match(CHAR_RE) ?? [];
  const uniq = new Set(chars);
  const withTr = tokens.filter((t) => t.translation).length;
  const withTips = tokens.filter((t) => t.translation?.tips?.length > 0).length;
  const expl = tokens
    .flatMap((t) => t.translation?.tips ?? [])
    .filter((x) => x.explanation).length;

  catalogue.push({
    id: book.id,
    title: book.title,
    sampleText: expected.slice(0, 200),
    level: book.level ?? 1,
    coverUrl: book.coverUrl,
    position: 0,
    times: 0,
    listeningTimes: 0,
    narrator: 'Yui',
    audioDuration: Math.round((chars.length / 200) * 10) / 10,
    published: true,
    tryout: book.id <= 40003,
    score: null,
    uniqueWordsNumber: uniq.size,
    lang: 'ja',
  });

  console.log(
    `${book.slug}: OK lossless ✓ | tokens ${tokens.length} | trad ${withTr} | tips ${withTips} | expl ${expl} | furigana ${furiCount} | caracteres ${chars.length} | unicos ${uniq.size}`
  );
}

writeFileSync(join(DATA, 'readers-ja.json'), JSON.stringify(catalogue, null, 0));
console.log(`catalogo ja: ${catalogue.length} livros`);
