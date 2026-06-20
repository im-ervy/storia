// Ingere o dump completo de /graded-readers (Nivel 1..7, uma pasta por livro
// com info.txt, capa.png e <título>.sentences.json) e reconstrói:
//   data/content/{id}.json   tokens completos de cada livro
//   data/readers.json        catálogo real (mescla metadados capturados no HAR)
//   data/levels.json         contagem real por nível
//   data/realContent.json    ids com conteúdo real
//   public/covers/{id}-covers.png  capas (mantém as do HAR quando já existem)
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
  existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'graded-readers');
const OUT = join(ROOT, 'data');
const CONTENT = join(OUT, 'content');
const COVERS = join(ROOT, 'public', 'covers');

// Metadados reais capturados no HAR (score, tryout, posição, vezes lidas...)
// — válidos para os readers do nível 1; os demais entram com defaults.
const captured = new Map(
  JSON.parse(readFileSync(join(OUT, 'readers.json'), 'utf8')).map((r) => [r.id, r])
);

function parseInfo(file) {
  const out = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const catalogue = [];
const ids = new Set();
const levelCounts = {};

for (const levelDir of readdirSync(SRC).sort()) {
  const levelPath = join(SRC, levelDir);
  for (const bookDir of readdirSync(levelPath).sort()) {
    const bookPath = join(levelPath, bookDir);
    const info = parseInfo(join(bookPath, 'info.txt'));
    const id = Number(info['ID']);
    const level = Number(info['Nível']);
    const title = info['Título'];
    if (!id || !level || !title) {
      console.warn(`PULADO (info.txt incompleto): ${bookPath}`);
      continue;
    }
    if (ids.has(id)) {
      console.warn(`PULADO (id ${id} duplicado): ${bookPath}`);
      continue;
    }
    ids.add(id);

    // Tokens completos
    const sentencesFile = readdirSync(bookPath).find((f) => f.endsWith('.sentences.json'));
    const tokens = JSON.parse(readFileSync(join(bookPath, sentencesFile), 'utf8'));
    writeFileSync(
      join(CONTENT, `${id}.json`),
      JSON.stringify({ id, total: tokens.length, tokens }, null, 0)
    );

    // Capa: a do HAR (quando existe) é a original servida pelo site
    const coverFile = `${id}-covers.png`;
    if (!existsSync(join(COVERS, coverFile))) {
      copyFileSync(join(bookPath, 'capa.png'), join(COVERS, coverFile));
    }

    const old = captured.get(id);
    const sampleText =
      old?.sampleText ??
      tokens
        .map((t) => t.text)
        .join('')
        .slice(0, 400);

    catalogue.push({
      id,
      title,
      sampleText,
      level,
      coverUrl: `/covers/${coverFile}`,
      position: old?.position ?? 0,
      times: old?.times ?? 0,
      listeningTimes: old?.listeningTimes ?? 0,
      narrator: info['Narrador'] || 'Natalie',
      audioDuration: Number(info['Duração do áudio (min)']) || 0,
      published: true,
      tryout: old?.tryout ?? false,
      score: old?.score ?? null,
      uniqueWordsNumber: Number(info['Palavras únicas']) || 0,
    });
    levelCounts[level] = (levelCounts[level] ?? 0) + 1;
  }
}

writeFileSync(join(OUT, 'readers.json'), JSON.stringify(catalogue, null, 0));
writeFileSync(join(OUT, 'realContent.json'), JSON.stringify([...ids]));

// Níveis 1..8 (o 8 existe na navegação do original, mas indisponível)
const levels = [];
for (let lvl = 1; lvl <= 8; lvl++) {
  const count = levelCounts[lvl] ?? 0;
  levels.push({ id: lvl, publishedReadersCount: count, available: count > 0 });
}
writeFileSync(join(OUT, 'levels.json'), JSON.stringify(levels, null, 0));

console.log(`Livros ingeridos: ${catalogue.length}`);
for (const [lvl, n] of Object.entries(levelCounts)) console.log(`  Nível ${lvl}: ${n}`);
