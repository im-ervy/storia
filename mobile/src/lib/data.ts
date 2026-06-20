// Porta client-side de src/lib/data.ts do app web. Mesma lógica de catálogo,
// filtros e métricas — só que o conteúdo é carregado de forma assíncrona
// (assets, ver content.ts) e o progresso/notas vivem em AsyncStorage (store.ts)
// no lugar do fs/userState.json do servidor.
import type { Reader, LevelMeta, ReadingStat } from './types';
import { getContent } from './content';
import {
  getProgress,
  setProgress,
  getStoredScore,
  setStoredScore,
  type UserScore,
} from './store';

import readersEnJson from '../catalog/readers.json';
import readersFrJson from '../catalog/readers-fr.json';
import readersZhJson from '../catalog/readers-zh.json';
import readersRuJson from '../catalog/readers-ru.json';
import readersJaJson from '../catalog/readers-ja.json';
import readersEsJson from '../catalog/readers-es.json';
import readersItJson from '../catalog/readers-it.json';
import readersRealJson from '../catalog/readers-realbooks.json';
import levelsJson from '../catalog/levels.json';

// Conta NOVA: o catálogo vem com o estado da conta capturada no HAR
// (times/position/score já preenchidos). Zeramos esses campos de usuário para
// que o app comece do zero — só o progresso real (AsyncStorage) marca leitura.
// `uniqueWordsNumber` é propriedade do livro e permanece.
function freshReader(r: Reader, lang: string): Reader {
  return { ...r, lang, times: 0, position: 0, listeningTimes: 0, score: null };
}

// Catálogo original (inglês) + catálogos de outros idiomas, distinguidos pelo
// campo lang (idêntico ao boot do data.ts no servidor).
const readers: Reader[] = (readersEnJson as Reader[]).map((r) => freshReader(r, r.lang ?? 'en'));
const LANG_CATALOGS: [string, Reader[]][] = [
  ['fr', readersFrJson as Reader[]],
  ['zh', readersZhJson as Reader[]],
  ['ru', readersRuJson as Reader[]],
  ['ja', readersJaJson as Reader[]],
  ['es', readersEsJson as Reader[]],
  ['it', readersItJson as Reader[]],
];
for (const [lang, list] of LANG_CATALOGS) {
  for (const r of list) readers.push(freshReader(r, lang));
}
// "Real Books" (nível 9): livros autênticos em inglês.
for (const r of readersRealJson as Reader[]) readers.push(freshReader(r, r.lang ?? 'en'));

const levels: LevelMeta[] = levelsJson as LevelMeta[];
const readersById = new Map(readers.map((r) => [r.id, r]));

export function allLangs(): string[] {
  const set = new Set<string>();
  for (const r of readers) set.add(r.lang ?? 'en');
  return Array.from(set);
}

export function getLevels(lang = 'en'): LevelMeta[] {
  if (lang === 'en') return levels;
  return Array.from({ length: 8 }, (_, i) => {
    const id = i + 1;
    const count = readers.filter((r) => r.lang === lang && r.level === id).length;
    return { id, publishedReadersCount: count, available: count > 0 };
  });
}

// Um reader conta como lido apenas se foi terminado de fato (progresso real).
// O estado da conta capturada no HAR foi zerado no load (freshReader).
function isRead(r: Reader): boolean {
  return getProgress(r.id)?.finished ?? false;
}

// Estatísticas de leitura POR IDIOMA: progresso por nível e total de readers
// concluídos contam só o idioma ativo (antes era fixo em inglês, então o
// progresso de francês/etc. ficava sempre 0).
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
  lang?: string;
}

export function queryReaders(q: ReaderQuery) {
  const lang = q.lang ?? 'en';
  let list = readers.filter((r) => r.level === q.level && r.published && r.lang === lang);

  list = list.map((r) => {
    const p = getProgress(r.id);
    const score = getStoredScore(r.id)?.scoreValue ?? r.score;
    return p ? { ...r, position: p.position, times: p.times, score } : { ...r, score };
  });

  if (q.readingStatus && q.readingStatus !== 'All') {
    list = list.filter((r) => {
      const read = isRead(r);
      const started = read || r.position > 0 || (getProgress(r.id)?.position ?? 0) > 0;
      if (q.readingStatus === 'Read') return read;
      if (q.readingStatus === 'Reading') return started && !read;
      if (q.readingStatus === 'Unread') return !started;
      return true;
    });
  }

  // tryout DESC, depois título ASC (EN) ou id ASC (outros idiomas), igual ao web.
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
  const p = getProgress(id);
  const score = getStoredScore(id)?.scoreValue ?? r.score;
  return p ? { ...r, position: p.position, times: p.times, score } : { ...r, score };
}

export function getScore(id: number): UserScore | { scoreValue: number; creationDate: null } {
  return getStoredScore(id) ?? { scoreValue: 0, creationDate: null };
}

export function setScore(id: number, score: number): void {
  setStoredScore(id, {
    scoreValue: Math.max(1, Math.min(5, Math.round(score))),
    creationDate: new Date().toISOString(),
  });
}

// ---- Conteúdo e posição (async, ver content.ts) ----
export async function getResume(id: number, size: number) {
  const content = await getContent(id);
  const p = getProgress(id);
  const start = p ? Math.min(p.position, Math.max(0, content.tokens.length - 1)) : 0;
  return {
    index: start,
    total: content.total,
    sentences: content.tokens.slice(start, start + size),
  };
}

export async function getSentences(id: number, index: number, size: number) {
  const content = await getContent(id);
  return {
    index,
    total: content.total,
    sentences: content.tokens.slice(index, index + size),
  };
}

export async function markRead(id: number, position: number): Promise<void> {
  const content = await getContent(id);
  const prev = getProgress(id) ?? { position: 0, times: 0, finished: false };
  if (position === 0) {
    setProgress(id, { ...prev, position: 0 });
    return;
  }
  const finished = position >= content.tokens.length - 1;
  setProgress(id, {
    position: Math.max(prev.position, position),
    times: finished && !prev.finished ? prev.times + 1 : prev.times,
    finished: prev.finished || finished,
  });
}

export async function finishReader(id: number): Promise<void> {
  const content = await getContent(id);
  await markRead(id, content.tokens.length - 1);
}

// ---- Contagem de palavras (mesma tokenização do servidor) ----
const WORD_RE = /[a-zà-ɏ]+(?:['’][a-z]+)?|[а-яё]+|[一-鿿]|[ぁ-ゖァ-ヺ々ー]/gi;
const wordsCache = new Map<number, string[]>();

async function wordsOf(id: number): Promise<string[]> {
  const cached = wordsCache.get(id);
  if (cached) return cached;
  const content = await getContent(id);
  const text = content.tokens.map((t) => t.text).join('');
  const words = (text.toLowerCase().match(WORD_RE) ?? []) as string[];
  wordsCache.set(id, words);
  return words;
}

export async function getReaderInfo(id: number) {
  const r = readersById.get(id);
  const words = await wordsOf(id);
  return {
    wordsNumber: words.length,
    uniqueWordsNumber: new Set(words).size,
    googleFormsUrl: null,
    level: r?.level ?? 1,
    publishedCount: 0,
  };
}

// Total de palavras lidas/únicas POR IDIOMA (o contador do header e os totais da
// congratulation refletem só os readers terminados naquele idioma).
export async function getReadTextsInfo(lang?: string) {
  const finished = readers.filter((r) => isRead(r) && (!lang || (r.lang ?? 'en') === lang));
  let wordsRead = 0;
  const unique = new Set<string>();
  for (const r of finished) {
    const words = await wordsOf(r.id);
    wordsRead += words.length;
    for (const w of words) unique.add(w);
  }
  return { wordsNumber: wordsRead, uniqueWordsNumber: unique.size };
}
