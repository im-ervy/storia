// Monta os graded readers em espanhol a partir das seções anotadas:
// valida lossless contra o texto-fonte, gera data/content/<id>.json e
// reconstrói o catálogo data/readers-es.json. (cópia do assemble-fr.mjs)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(process.cwd(), 'data');
const ES = join(DATA, 'es');

// Registro dos livros espanhóis (acrescente aqui os próximos). Faixa de id 50001+.
const BOOKS = [
  {
    id: 50001,
    slug: 'el-nino-que-no-podia-decir-la-verdad',
    title: 'El Niño Que No Podía Decir La Verdad',
    sectionPrefix: '_50001-section-',
    sections: 4,
    coverUrl: '/covers/23-covers.png',
  },
  {
    id: 50002,
    slug: 'el-lugar-feliz',
    title: 'El Lugar Feliz',
    sectionPrefix: '_50002-section-',
    sections: 4,
    coverUrl: '/covers/25-covers.png',
  },
  {
    id: 50003,
    slug: 'la-partera',
    title: 'La Partera',
    sectionPrefix: '_50003-section-',
    sections: 4,
    coverUrl: '/covers/17-covers.png',
  },
  {
    id: 50004,
    slug: 'las-preguntas-de-ana',
    title: 'Las Preguntas de Ana',
    sectionPrefix: '_50004-section-',
    sections: 4,
    coverUrl: '/covers/26-covers.png',
  },
  {
    id: 50005,
    slug: 'corazon-frio',
    title: 'Corazón Frío',
    sectionPrefix: '_50005-section-',
    sections: 4,
    coverUrl: '/covers/11-covers.png',
  },
  {
    id: 50006,
    slug: 'buen-corazon-y-sus-cuatro-amigos',
    title: 'Buen Corazón y Sus Cuatro Amigos',
    sectionPrefix: '_50006-section-',
    sections: 4,
    coverUrl: '/covers/7-covers.png',
  },
  {
    id: 50007,
    slug: 'como-la-medusa-perdio-su-caparazon',
    title: 'Cómo la Medusa Perdió su Caparazón',
    sectionPrefix: '_50007-section-',
    sections: 4,
    coverUrl: '/covers/1-covers.png',
  },
  {
    id: 50008,
    slug: 'como-romeo-y-julieta',
    title: 'Como Romeo y Julieta',
    sectionPrefix: '_50008-section-',
    sections: 4,
    coverUrl: '/covers/24-covers.png',
  },
  {
    id: 50009,
    slug: 'favor-con-favor-se-paga',
    title: 'Favor con Favor se Paga',
    sectionPrefix: '_50009-section-',
    sections: 4,
    coverUrl: '/covers/9-covers.png',
  },
];

const WORD_RE = /[a-zà-ÿœ]+(?:['’][a-zà-ÿœ]+)*/gi;
const catalogue = [];

for (const book of BOOKS) {
  const sectionFiles = Array.from(
    { length: book.sections },
    (_, i) => join(ES, `${book.sectionPrefix}${i + 1}.json`)
  );
  if (!sectionFiles.every((f) => existsSync(f))) {
    console.log(`(${book.slug}: seções incompletas — pulado)`);
    continue;
  }
  const source = readFileSync(join(ES, `${book.slug}.txt`), 'utf8');
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
    narrator: 'Lucía',
    audioDuration: Math.round((words.length / 130) * 10) / 10,
    published: true,
    // Espelha o original: só os 3 primeiros readers do nível são tryout.
    tryout: book.id <= 50003,
    score: null,
    uniqueWordsNumber: uniq.size,
    lang: 'es',
  });

  console.log(
    `${book.slug}: OK lossless ✓ | tokens ${tokens.length} | trad ${withTr} | tips ${withTips} | expl ${expl} | palavras ${words.length} | unicas ${uniq.size} | TTR ${(uniq.size / words.length).toFixed(2)}`
  );
}

writeFileSync(join(DATA, 'readers-es.json'), JSON.stringify(catalogue, null, 0));
console.log(`catalogo es: ${catalogue.length} livros`);
