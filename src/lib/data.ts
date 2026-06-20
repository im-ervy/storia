import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  Reader,
  ReaderContent,
  LevelMeta,
  ReadingStat,
  Token,
} from './types';

const DATA = join(process.cwd(), 'data');

function read<T>(file: string): T {
  return JSON.parse(readFileSync(join(DATA, file), 'utf8')) as T;
}

// Conta NOVA: o catálogo vem com o estado da conta capturada no HAR
// (times/position/score já preenchidos — o "Renan" com 9 livros lidos). Zeramos
// esses campos de usuário no load para que o app comece do zero; só o progresso
// real (userState.json) marca leitura. `uniqueWordsNumber` é propriedade do
// livro (palavras novas) e permanece.
function freshReader(r: Reader, lang: string): Reader {
  return { ...r, lang, times: 0, position: 0, listeningTimes: 0, score: null };
}

// Loaded once per server process. O catálogo original (inglês) + catálogos de
// outros idiomas (readers-<lang>.json), distinguidos pelo campo lang.
const readers: Reader[] = read<Reader[]>('readers.json').map((r: Reader) =>
  freshReader(r, r.lang ?? 'en')
);
for (const lang of ['fr', 'zh', 'ru', 'ja', 'es', 'it']) {
  const file = join(DATA, `readers-${lang}.json`);
  if (existsSync(file)) {
    for (const r of JSON.parse(readFileSync(file, 'utf8')) as Reader[]) {
      readers.push(freshReader(r, lang));
    }
  }
}
// "Real Books" (nível 9): livros AUTÊNTICOS em inglês (não-graded), anotados
// com a mesma metodologia (tradução por chunk + tips + notas). Catálogo
// separado para não colidir com o dump ingerido em readers.json.
const realBooksFile = join(DATA, 'readers-realbooks.json');
if (existsSync(realBooksFile)) {
  for (const r of JSON.parse(readFileSync(realBooksFile, 'utf8')) as Reader[]) {
    readers.push(freshReader(r, r.lang ?? 'en'));
  }
}
const levels: LevelMeta[] = read<LevelMeta[]>('levels.json');
const readersById = new Map(readers.map((r) => [r.id, r]));

// Progresso do usuário, persistido em data/userState.json (sobrevive a
// reinícios do servidor; o estado-base capturado do HAR segue no catálogo).
interface Progress {
  position: number; // token index read up to
  times: number;
  finished: boolean;
}
interface UserScore {
  scoreValue: number;
  creationDate: string;
}
const STATE_FILE = join(DATA, 'userState.json');
const progress = new Map<number, Progress>();
const userScores = new Map<number, UserScore>();
// Nome do usuário (perguntado no primeiro acesso; vazio = ainda não definido).
let userName = '';

function loadUserState() {
  if (!existsSync(STATE_FILE)) return;
  try {
    const s = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    for (const [id, p] of Object.entries(s.progress ?? {})) {
      progress.set(Number(id), p as Progress);
    }
    for (const [id, score] of Object.entries(s.scores ?? {})) {
      userScores.set(Number(id), score as UserScore);
    }
    userName = typeof s.userName === 'string' ? s.userName : '';
  } catch {
    /* estado corrompido: começa do zero */
  }
}
loadUserState();

function saveUserState() {
  const s = {
    userName,
    progress: Object.fromEntries(progress),
    scores: Object.fromEntries(userScores),
  };
  try {
    writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
  } catch {
    /* disco indisponível: segue só em memória */
  }
}

export function getUserName(): string {
  return userName;
}

export function setUserName(name: string): void {
  userName = name.trim().slice(0, 40);
  saveUserState();
}

export function getLevels(lang = 'en'): LevelMeta[] {
  if (lang === 'en') return levels;
  // Outros idiomas: níveis derivados do catálogo daquele idioma.
  return Array.from({ length: 8 }, (_, i) => {
    const id = i + 1;
    const count = readers.filter((r) => r.lang === lang && r.level === id).length;
    return { id, publishedReadersCount: count, available: count > 0 };
  });
}

export function getUserLevels() {
  return levels.map((l) => ({ levelId: l.id, blocked: false }));
}

// Um reader conta como lido apenas se foi terminado de fato (progresso real do
// usuário). O estado da conta capturada no HAR foi zerado no load (freshReader).
function isRead(r: Reader): boolean {
  return progress.get(r.id)?.finished ?? false;
}

// Estatísticas de leitura POR IDIOMA: progresso por nível e total de readers
// concluídos contam só o idioma ativo (antes era fixo em inglês, então o
// progresso de francês/etc. ficava sempre 0 na congratulation).
export function getReadingStats(lang = 'en'): ReadingStat[] {
  const langReaders = readers.filter((r) => (r.lang ?? 'en') === lang);
  const finishedTotal = langReaders.filter(isRead).length;
  return getLevels(lang).map((l) => {
    const inLevel = langReaders.filter((r) => r.level === l.id);
    const done = inLevel.filter(isRead).length;
    return {
      publishedReadersCount: l.publishedReadersCount,
      userProgress: done,
      level: l.id,
      totalReadersFinished: finishedTotal,
    };
  });
}

export interface ReaderQuery {
  level: number;
  readingStatus: string; // All | Read | Unread | Reading
  skip: number;
  take: number;
  orderBy: string;
  lang?: string;
}

export function queryReaders(q: ReaderQuery) {
  const lang = q.lang ?? 'en';
  let list = readers.filter((r) => r.level === q.level && r.published && r.lang === lang);

  // Reflect any in-memory progress (and user ratings) onto the returned cards.
  list = list.map((r) => {
    const p = progress.get(r.id);
    const score = userScores.get(r.id)?.scoreValue ?? r.score;
    return p ? { ...r, position: p.position, times: p.times, score } : { ...r, score };
  });

  if (q.readingStatus && q.readingStatus !== 'All') {
    list = list.filter((r) => {
      // O estado da conta capturada (times/position do catálogo) também conta.
      const read = isRead(r);
      const started = read || r.position > 0 || (progress.get(r.id)?.position ?? 0) > 0;
      if (q.readingStatus === 'Read') return read;
      if (q.readingStatus === 'Reading') return started && !read;
      if (q.readingStatus === 'Unread') return !started;
      return true;
    });
  }

  // orderBy " tryout DESC, title ASC". No catálogo EN a ordem alfabética
  // coincide com a sequência pedagógica da coleção; nos outros idiomas os
  // títulos traduzidos embaralhariam essa sequência, então ordenamos pelo id
  // (que codifica a ordem de produção 10001, 10002, ...).
  list = [...list].sort((a, b) => {
    if (a.tryout !== b.tryout) return a.tryout ? -1 : 1;
    return lang === 'en' ? a.title.localeCompare(b.title) : a.id - b.id;
  });

  const totalRows = list.length;
  const pageSize = q.take;
  const result = list.slice(q.skip, q.skip + q.take);
  return {
    currentPage: Math.floor(q.skip / q.take) + 1,
    pages: Math.max(1, Math.ceil(totalRows / pageSize)),
    pageSize,
    totalRows,
    result,
  };
}

export function getReader(id: number): Reader | undefined {
  const r = readersById.get(id);
  if (!r) return undefined;
  const p = progress.get(id);
  const score = userScores.get(id)?.scoreValue ?? r.score;
  return p ? { ...r, position: p.position, times: p.times, score } : { ...r, score };
}

// Espelha GET/POST /api/reader/{id}/score do original.
export function getScore(id: number): UserScore | { scoreValue: number; creationDate: null } {
  return userScores.get(id) ?? { scoreValue: 0, creationDate: null };
}

export function setScore(id: number, score: number) {
  userScores.set(id, {
    scoreValue: Math.max(1, Math.min(5, Math.round(score))),
    creationDate: new Date().toISOString(),
  });
  saveUserState();
}

// Espelha GET /api/reader/{id}/info do original (palavras do livro).
export function getReaderInfo(id: number) {
  const r = readersById.get(id);
  const words = wordsOf(id);
  return {
    wordsNumber: words.length,
    uniqueWordsNumber: new Set(words).size,
    googleFormsUrl: null,
    level: r?.level ?? 1,
    lang: r?.lang ?? 'en',
    publishedCount: 0,
  };
}

// Espelha PUT /api/reader/{id}/finish do original.
export function finishReader(id: number) {
  const content = getContent(id);
  markRead(id, content.tokens.length - 1);
}

// Ids that have real captured reading content on disk (content/<id>.json).
const realContentIds: number[] = read<number[]>('realContent.json');
const contentCache = new Map<number, ReaderContent>();

function loadContent(id: number): ReaderContent {
  const cached = contentCache.get(id);
  if (cached) return cached;
  const c = read<ReaderContent>(`content/${id}.json`);
  contentCache.set(id, c);
  return c;
}

export function getContent(id: number): ReaderContent {
  // Use the real captured content when we have it; otherwise fall back to one
  // of the captured books as a sample (the rest of the premium corpus was not
  // part of the capture).
  if (realContentIds.includes(id) || existsSync(join(DATA, 'content', `${id}.json`)))
    return loadContent(id);
  const sampleId = realContentIds[0] ?? 14;
  return { ...loadContent(sampleId), id };
}

export function getResume(id: number, size: number) {
  const content = getContent(id);
  const p = progress.get(id);
  const start = p ? Math.min(p.position, Math.max(0, content.tokens.length - 1)) : 0;
  return {
    index: start,
    total: content.total,
    sentences: content.tokens.slice(start, start + size),
  };
}

export function getSentences(id: number, index: number, size: number) {
  const content = getContent(id);
  return {
    index,
    total: content.total,
    sentences: content.tokens.slice(index, index + size),
  };
}

export function markRead(id: number, position: number) {
  const content = getContent(id);
  const prev = progress.get(id) ?? { position: 0, times: 0, finished: false };
  if (position === 0) {
    // "Recomeçar leitura": zera a posição salva (espelha o endpoint restart
    // do site original, que também era acionado ao voltar à primeira página).
    progress.set(id, { ...prev, position: 0 });
    saveUserState();
    return;
  }
  const finished = position >= content.tokens.length - 1;
  progress.set(id, {
    position: Math.max(prev.position, position),
    times: finished && !prev.finished ? prev.times + 1 : prev.times,
    finished: prev.finished || finished,
  });
  saveUserState();
}

// Palavras de um reader, minúsculas, extraídas do texto real (cacheadas).
// A mesma tokenização reproduz exatamente o uniqueWordsNumber do catálogo
// original (ex.: reader 23 -> 377 únicas). Para idiomas CJK (mandarim e
// japonês), cada caractere conta como uma "palavra" — no japonês, kanji +
// hiragana + katakana (々 e ー incluídos); o russo (cirílico) conta por
// palavra como os idiomas latinos.
const WORD_RE = /[a-zà-ɏ]+(?:['’][a-z]+)?|[а-яё]+|[一-鿿]|[ぁ-ゖァ-ヺ々ー]/gi;
const wordsCache = new Map<number, string[]>();
function wordsOf(id: number): string[] {
  const cached = wordsCache.get(id);
  if (cached) return cached;
  const text = getContent(id).tokens.map((t) => t.text).join('');
  const words = (text.toLowerCase().match(WORD_RE) ?? []) as string[];
  wordsCache.set(id, words);
  return words;
}

// Total de palavras lidas/únicas. A contagem é POR IDIOMA: o contador do header
// e os totais da congratulation refletem só os readers terminados naquele idioma
// (somar inglês + francês + japonês na mesma métrica não faria sentido).
export function getReadTextsInfo(lang?: string) {
  const finished = readers.filter((r) => isRead(r) && (!lang || (r.lang ?? 'en') === lang));
  let wordsRead = 0;
  const unique = new Set<string>();
  for (const r of finished) {
    const words = wordsOf(r.id);
    wordsRead += words.length;
    for (const w of words) unique.add(w);
  }
  return {
    wordsNumber: wordsRead,
    uniqueWordsNumber: unique.size,
  };
}

export function getTokenText(id: number, index: number): string {
  const content = getContent(id);
  return content.tokens[index]?.text ?? '';
}
