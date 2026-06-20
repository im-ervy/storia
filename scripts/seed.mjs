// Seeds clean JSON data from the raw HAR-extracted payloads.
// Fixes the mojibake (UTF-8 bytes that were decoded as Latin-1) by reversing
// the encoding on the raw JSON text *before* JSON.parse, so the literal
// escapes (pure ASCII) survive untouched.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RAW = join(ROOT, 'raw');
const OUT = join(ROOT, 'data');
const CONTENT = join(OUT, 'content');
mkdirSync(CONTENT, { recursive: true });

// The HAR tool decoded UTF-8 response bytes as Windows-1252, producing mojibake
// (e.g. "â€™" for U+2019, "Ã¡" for "á"). Reverse it by mapping each character
// back to its cp1252 byte and re-decoding as UTF-8. cp1252 == latin1 except for
// 0x80-0x9F, so we only need the reverse map for those code points.
const CP1252_HIGH = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};
function demojibake(s) {
  const bytes = [];
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c <= 0xff) bytes.push(c);
    else if (CP1252_HIGH[c] != null) bytes.push(CP1252_HIGH[c]);
    else return null; // a genuine (non-mojibled) char: this reversal doesn't apply
  }
  return Buffer.from(bytes).toString('utf8');
}

function loadFixed(file) {
  let s = readFileSync(join(RAW, file), 'utf8');
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1); // strip BOM
  const junk = (t) => (t.match(/[�ÃÂâ€]/g) || []).length;
  const candidates = [];
  const fixed = demojibake(s);
  if (fixed != null) {
    try {
      candidates.push(JSON.parse(fixed));
    } catch {
      /* reversal didn't yield valid JSON */
    }
  }
  try {
    candidates.push(JSON.parse(s));
  } catch {
    /* not valid as-is */
  }
  if (!candidates.length) throw new Error(`Cannot parse ${file}`);
  // Prefer the parse whose serialized form has the fewest mojibake markers.
  candidates.sort((a, b) => junk(JSON.stringify(a)) - junk(JSON.stringify(b)));
  return candidates[0];
}

// --- Library readers (level 1, real) ---
const realReaders = [];
for (const f of readdirSync(RAW).filter((f) => /^readers-page\d+\.json$/.test(f))) {
  const page = loadFixed(f);
  for (const r of page.result) realReaders.push(r);
}
// de-dup by id, normalise cover urls to local
const byId = new Map();
for (const r of realReaders) {
  const coverFile = r.coverUrl ? r.coverUrl.split('?')[0].split('/').pop() : null;
  byId.set(r.id, {
    ...r,
    coverUrl: coverFile ? `/covers/${coverFile}` : null,
  });
}
const level1 = [...byId.values()];
console.log(`Level 1 real readers: ${level1.length}`);

// --- Real book content captured in HAR files ---
// Generic: for every `reader{N}-resume.json` present in /raw, concatenate its
// resume page with any `reader{N}-sentences[-index].json` pages (in index order)
// to reconstruct the full token stream. Each book the user captures shows up here.
const rawFiles = readdirSync(RAW);
const realContentIds = new Set();
for (const f of rawFiles) {
  const m = f.match(/^reader(\d+)-resume\.json$/);
  if (!m) continue;
  const id = Number(m[1]);
  const resume = loadFixed(f);
  const pages = rawFiles
    .filter((x) => x.startsWith(`reader${id}-sentences`))
    .map((x) => ({ x, idx: Number((x.match(/sentences-(\d+)/) || [, '0'])[1]) }))
    .sort((a, b) => a.idx - b.idx);
  let tokens = [...resume.sentences];
  for (const p of pages) tokens = [...tokens, ...loadFixed(p.x).sentences];
  writeFileSync(
    join(CONTENT, `${id}.json`),
    JSON.stringify({ id, total: resume.total, tokens }, null, 0)
  );
  realContentIds.add(id);
  console.log(`Reader ${id} tokens: ${tokens.length} (declared total ${resume.total})`);
}
// Manifest of which ids have real captured content (consumed by the data layer).
writeFileSync(join(OUT, 'realContent.json'), JSON.stringify([...realContentIds]));

// --- Build full reader catalogue ---
// Level 1 uses the real data. Other levels are generated so the library is
// populated; their reading content falls back to the reader-14 sample.
const COVER_FILES = readdirSync(join(ROOT, 'assets_raw', 'covers'));
const NARRATORS = ['Natalie', 'James', 'Olivia', 'Daniel'];
const TITLES_POOL = [
  'The Lighthouse Keeper', 'A Letter From the Sea', 'The Clockmaker',
  'Winter in the Valley', 'The Last Train Home', 'A Garden of Stars',
  'The Painter and the King', 'Echoes in the Forest', 'The Quiet River',
  'Songs of the Old City', 'The Traveler', 'A Bridge of Words',
  'The Mountain Path', 'Letters to Tomorrow', 'The Glass House',
  'The Storyteller', 'A Map of the Heart', 'The Hidden Door',
  'Morning in the Market', 'The Silver Coin', 'A Friend in the Rain',
  'The Wandering Light', 'The Old Bookshop', 'A Promise Kept',
  'The Distant Shore', 'The Keeper of Time', 'A Window to the World',
  'The Northern Wind', 'Whispers of the Past', 'The Final Chapter',
];
const SAMPLE = level1[0]?.sampleText || 'Once upon a time, there was a story waiting to be read.';

const LEVEL_COUNTS = { 1: 30, 2: 30, 3: 30, 4: 30, 5: 30, 6: 30, 7: 15, 8: 0 };
const catalogue = [...level1];
let nextId = 1000;
for (let lvl = 2; lvl <= 8; lvl++) {
  const count = LEVEL_COUNTS[lvl];
  for (let i = 0; i < count; i++) {
    const cover = COVER_FILES[(lvl * 7 + i) % COVER_FILES.length];
    catalogue.push({
      id: nextId++,
      title: TITLES_POOL[i % TITLES_POOL.length] + (i >= TITLES_POOL.length ? ' II' : ''),
      sampleText: SAMPLE,
      level: lvl,
      coverUrl: `/covers/${cover}`,
      position: 0,
      times: 0,
      listeningTimes: 0,
      narrator: NARRATORS[(i + lvl) % NARRATORS.length],
      audioDuration: 12 + (i % 8),
      published: true,
      tryout: i < 3,
      score: i % 4 === 0 ? null : 3 + (i % 3),
      uniqueWordsNumber: 300 + ((lvl - 1) * 120) + (i * 7) % 200,
    });
  }
}

writeFileSync(join(OUT, 'readers.json'), JSON.stringify(catalogue, null, 0));
console.log(`Total catalogue readers: ${catalogue.length}`);

// Levels meta
const levels = Object.entries(LEVEL_COUNTS).map(([id, c]) => ({
  id: Number(id),
  publishedReadersCount: c,
  available: c > 0,
}));
writeFileSync(join(OUT, 'levels.json'), JSON.stringify(levels, null, 0));
console.log('Wrote levels.json');
