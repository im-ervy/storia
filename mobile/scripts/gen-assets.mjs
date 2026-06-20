// Empacota os dados do app web (catálogos + conteúdo + capas) dentro de mobile/.
//
// - Catálogos (readers*.json, levels.json, realContent.json) são pequenos e vão
//   para mobile/src/catalog/ como JSON importável diretamente.
// - Conteúdo (data/content/<id>.json, 30MB) NÃO pode ir inline no bundle JS:
//   é copiado para mobile/assets/content/<id>.txt (JSON cru) e tratado como
//   ASSET (metro.config.js registra 'txt' em assetExts). Carregado sob demanda
//   via expo-asset + expo-file-system.
// - Capas (public/covers/*) são copiadas para mobile/assets/covers/.
// - Gera os "require maps" (contentMap.ts, coverMap.ts) — o Metro precisa de
//   require() estáticos para empacotar assets.
//
// Rode a partir de mobile/:  npm run assets
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const MOBILE = process.cwd();
const ROOT = join(MOBILE, '..');
const DATA = join(ROOT, 'data');
const COVERS_SRC = join(ROOT, 'public', 'covers');

const ASSET_CONTENT = join(MOBILE, 'assets', 'content');
const ASSET_COVERS = join(MOBILE, 'assets', 'covers');
const CATALOG = join(MOBILE, 'src', 'catalog');
const GENERATED = join(MOBILE, 'src', 'generated');

function reset(dir) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}
[ASSET_CONTENT, ASSET_COVERS, CATALOG, GENERATED].forEach(reset);

// ---- Catálogos (JSON importável) ----
const CATALOG_FILES = [
  'readers.json',
  'readers-fr.json',
  'readers-zh.json',
  'readers-ru.json',
  'readers-ja.json',
  'readers-es.json',
  'readers-it.json',
  'readers-realbooks.json',
  'levels.json',
  'realContent.json',
];
for (const f of CATALOG_FILES) {
  const src = join(DATA, f);
  if (existsSync(src)) copyFileSync(src, join(CATALOG, f));
  else console.warn(`[catalog] ausente: ${f}`);
}

// ---- Conteúdo (asset .txt + require map) ----
const contentFiles = readdirSync(join(DATA, 'content')).filter((f) => f.endsWith('.json'));
const contentIds = [];
for (const f of contentFiles) {
  const id = Number(basename(f, '.json'));
  if (!Number.isFinite(id)) continue;
  copyFileSync(join(DATA, 'content', f), join(ASSET_CONTENT, `${id}.txt`));
  contentIds.push(id);
}
contentIds.sort((a, b) => a - b);
const contentMap = [
  '// GERADO por scripts/gen-assets.mjs — não editar à mão.',
  '// id do reader -> módulo de asset (JSON cru em assets/content/<id>.txt).',
  'export const contentMap: Record<number, number> = {',
  ...contentIds.map((id) => `  ${id}: require('../../assets/content/${id}.txt'),`),
  '};',
  '',
].join('\n');
writeFileSync(join(GENERATED, 'contentMap.ts'), contentMap);

// ---- Capas (asset de imagem + require map por nome de arquivo) ----
// IMPORTANTE: ~190 capas do dump têm extensão .png mas conteúdo JPEG. O Android
// (AAPT) compila drawables pela EXTENSÃO e quebra ("file failed to compile") se
// um .png for na verdade JPEG. Então detectamos o tipo real por magic bytes e
// gravamos o asset com a extensão certa; o coverMap continua indexado pelo nome
// ORIGINAL do catálogo (coverUrl), apontando para o arquivo corrigido.
function realExt(buf, fallback) {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  return fallback;
}
const coverFiles = existsSync(COVERS_SRC)
  ? readdirSync(COVERS_SRC).filter((f) => /\.(png|jpg|jpeg|gif)$/i.test(f))
  : [];
const coverEntries = [];
for (const f of coverFiles) {
  const buf = readFileSync(join(COVERS_SRC, f));
  const ext = realExt(buf, (extname(f).slice(1) || 'png').toLowerCase());
  const target = `${f.replace(/\.[^.]+$/, '')}.${ext}`;
  writeFileSync(join(ASSET_COVERS, target), buf);
  coverEntries.push([f, target]);
}
const coverMap = [
  '// GERADO por scripts/gen-assets.mjs — não editar à mão.',
  '// nome do arquivo de capa (basename de coverUrl) -> módulo de imagem.',
  'export const coverMap: Record<string, number> = {',
  ...coverEntries.map(
    ([orig, target]) => `  ${JSON.stringify(orig)}: require('../../assets/covers/${target}'),`
  ),
  '};',
  '',
].join('\n');
writeFileSync(join(GENERATED, 'coverMap.ts'), coverMap);

console.log(
  `OK: ${contentIds.length} conteúdos, ${coverFiles.length} capas, ${CATALOG_FILES.length} catálogos.`
);
