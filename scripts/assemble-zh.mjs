// Monta os graded readers de mandarim a partir das seções anotadas:
// valida lossless contra o texto-fonte, gera data/content/<id>.json e
// reconstrói o catálogo data/readers-zh.json.
//
// Diferenças vs assemble-fr: os parágrafos são unidos SEM espaço (chinês não
// tem espaços) e as métricas contam caracteres Han (cada um = uma "palavra",
// como em data.ts). uniqueWordsNumber do catálogo = caracteres únicos.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const ZH = join(DATA, 'zh');

// Registro dos livros de mandarim (faixa de ids 20001+).
const BOOKS = [
  {
    id: 20001,
    slug: 'bu-hui-shuo-zhen-hua-de-nan-hai',
    title: '不会说真话的男孩',
    sectionPrefix: '_20001-section-',
    sections: 4,
    coverUrl: '/covers/23-covers.png', // mesmo original EN do fr 10001
  },
  {
    id: 20002,
    slug: 'kuai-le-di',
    title: '快乐地',
    sectionPrefix: '_20002-section-',
    sections: 4,
    coverUrl: '/covers/25-covers.png', // mesmo original EN #2 (The Happy Place)
  },
  {
    id: 20003,
    slug: 'jie-sheng-po',
    title: '接生婆',
    sectionPrefix: '_20003-section-',
    sections: 4,
    coverUrl: '/covers/17-covers.png', // mesmo original EN #3 (The Midwife)
  },
  {
    id: 20004,
    slug: 'an-na-de-wen-ti',
    title: '安娜的问题',
    sectionPrefix: '_20004-section-',
    sections: 4,
    coverUrl: '/covers/26-covers.png', // mesmo original EN #4 (Anna's Questions)
  },
  {
    id: 20005,
    slug: 'leng-xin',
    title: '冷心',
    sectionPrefix: '_20005-section-',
    sections: 4,
    coverUrl: '/covers/11-covers.png', // mesmo original EN #5 (Cold Heart)
  },
];

const HAN_RE = /[一-鿿]/g;
const catalogue = [];

for (const book of BOOKS) {
  const sectionFiles = Array.from(
    { length: book.sections },
    (_, i) => join(ZH, `${book.sectionPrefix}${i + 1}.json`)
  );
  if (!sectionFiles.every((f) => existsSync(f))) {
    console.log(`(${book.slug}: seções incompletas — pulado)`);
    continue;
  }
  const source = readFileSync(join(ZH, `${book.slug}.txt`), 'utf8');
  const paragraphs = source
    .split(/\r?\n\r?\n+/)
    .map((p) => p.trim().replace(/\r?\n/g, ''))
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
    console.error('  esperado: ' + JSON.stringify(expected.slice(Math.max(0, d - 20), d + 20)));
    console.error('  obtido:   ' + JSON.stringify(concat.slice(Math.max(0, d - 20), d + 20)));
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

  const chars = expected.match(HAN_RE) ?? [];
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
    narrator: 'Mei',
    // Leitura em voz alta de chinês: ~200 caracteres/min.
    audioDuration: Math.round((chars.length / 200) * 10) / 10,
    published: true,
    tryout: book.id <= 20003,
    score: null,
    uniqueWordsNumber: uniq.size,
    lang: 'zh',
  });

  console.log(
    `${book.slug}: OK lossless ✓ | tokens ${tokens.length} | trad ${withTr} | tips ${withTips} | expl ${expl} | caracteres ${chars.length} | unicos ${uniq.size}`
  );
}

writeFileSync(join(DATA, 'readers-zh.json'), JSON.stringify(catalogue, null, 0));
console.log(`catalogo zh: ${catalogue.length} livros`);
