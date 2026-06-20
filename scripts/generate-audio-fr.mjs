/**
 * Gera áudios dos graded readers franceses via edge-tts (fr-FR-DeniseNeural).
 *
 * Pré-requisito:  pip install edge-tts
 * Uso:            node scripts/generate-audio-fr.mjs
 *                 node scripts/generate-audio-fr.mjs --id 10001        # só um livro
 *                 node scripts/generate-audio-fr.mjs --full-only       # só livro inteiro
 *                 node scripts/generate-audio-fr.mjs --para-only       # só parágrafos
 *
 * Saída:
 *   public/audio/fr-<id>.mp3                 → livro completo
 *   public/audio/fr-<id>-para-<NNN>.mp3      → parágrafo N (base-1, zero-padded)
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VOICE = 'fr-FR-DeniseNeural';
const AUDIO_DIR = join(ROOT, 'public', 'audio');
const TMP_FILE = join(ROOT, 'data', 'fr', '_tts-tmp.txt');

// ── Catálogo ──────────────────────────────────────────────────────────────────
// Adicionar novos livros aqui conforme forem produzidos.
const ALL_BOOKS = [
  { id: 10001, slug: 'le-garcon-qui-ne-pouvait-pas-dire-la-verite' },
  { id: 10002, slug: 'l-endroit-heureux' },
  { id: 10003, slug: 'la-sage-femme' },
  { id: 10004, slug: 'les-questions-d-anna' },
  { id: 10005, slug: 'coeur-froid' },
  { id: 10006, slug: 'bon-coeur-et-ses-quatre-amis' },
  { id: 10007, slug: 'comment-la-meduse-a-perdu-sa-carapace' },
  { id: 10008, slug: 'comme-romeo-et-juliette' },
  { id: 10009, slug: 'un-bienfait-n-est-jamais-perdu' },
  { id: 10010, slug: 'etoile-yeux-noirs-et-longs-bras' },
  { id: 10011, slug: 'tete-forte-et-son-chien' },
  { id: 10012, slug: 'l-oiseau-de-verite' },
  { id: 10013, slug: 'le-chien-qui-parlait-trop' },
  { id: 10014, slug: 'le-dragon' },
  { id: 10015, slug: 'le-chien-de-feu-et-le-chien-bleu' },
  { id: 10016, slug: 'les-quatre-garcons' },
  { id: 10017, slug: 'la-maison-du-feu-noir' },
  { id: 10018, slug: 'la-petite-fille-qui-voulait-une-etoile' },
  { id: 10019, slug: 'la-petite-soeur' },
  { id: 10020, slug: 'la-maison-magique' },
];

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const idArg = args.includes('--id') ? Number(args[args.indexOf('--id') + 1]) : null;
const fullOnly = args.includes('--full-only');
const paraOnly = args.includes('--para-only');
const doFull = !paraOnly;
const doPara = !fullOnly;

const BOOKS = idArg ? ALL_BOOKS.filter((b) => b.id === idArg) : ALL_BOOKS;

if (!BOOKS.length) {
  console.error(`Livro não encontrado: --id ${idArg}`);
  process.exit(1);
}

// ── Verificar edge-tts ────────────────────────────────────────────────────────
function edgeTtsCmd() {
  // Tenta 'edge-tts' direto; fallback para 'python -m edge_tts'.
  const direct = spawnSync('edge-tts', ['--version'], { encoding: 'utf8' });
  if (!direct.error) return ['edge-tts'];
  const module = spawnSync('python', ['-m', 'edge_tts', '--version'], { encoding: 'utf8' });
  if (!module.error) return ['python', '-m', 'edge_tts'];
  return null;
}

const CMD = edgeTtsCmd();
if (!CMD) {
  console.error('edge-tts não encontrado.\nInstale com:  pip install edge-tts');
  process.exit(1);
}

// ── TTS ───────────────────────────────────────────────────────────────────────
function tts(text, outPath) {
  if (existsSync(outPath)) {
    console.log(`  já existe, pulando: ${outPath.replace(ROOT, '.')}`);
    return;
  }
  writeFileSync(TMP_FILE, text, 'utf8');
  const result = spawnSync(
    CMD[0],
    [...CMD.slice(1), '--voice', VOICE, '--file', TMP_FILE, '--write-media', outPath],
    { encoding: 'utf8' }
  );
  if (result.status !== 0) {
    throw new Error(`edge-tts falhou:\n${result.stderr}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
mkdirSync(AUDIO_DIR, { recursive: true });

for (const book of BOOKS) {
  const txtPath = join(ROOT, 'data', 'fr', `${book.slug}.txt`);
  if (!existsSync(txtPath)) {
    console.warn(`[${book.id}] arquivo de texto não encontrado: ${txtPath}`);
    continue;
  }
  const text = readFileSync(txtPath, 'utf8');
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  console.log(`\n[${book.id}] ${book.slug}  (${paragraphs.length} parágrafos)`);

  if (doFull) {
    const out = join(AUDIO_DIR, `fr-${book.id}.mp3`);
    process.stdout.write('  livro completo... ');
    tts(paragraphs.join('\n\n'), out);
    console.log(`✓  fr-${book.id}.mp3`);
  }

  if (doPara) {
    for (let i = 0; i < paragraphs.length; i++) {
      const num = String(i + 1).padStart(3, '0');
      const outName = `fr-${book.id}-para-${num}.mp3`;
      process.stdout.write(`  parágrafo ${num}/${paragraphs.length}... `);
      tts(paragraphs[i], join(AUDIO_DIR, outName));
      console.log('✓');
    }
  }
}

if (existsSync(TMP_FILE)) unlinkSync(TMP_FILE);
console.log('\nPronto!');
