// Espelha src/lib/types.ts do app web (mesmo schema de dados).
export interface Reader {
  id: number;
  title: string;
  sampleText: string | null;
  level: number;
  coverUrl: string | null;
  position: number;
  times: number;
  listeningTimes: number;
  narrator: string;
  audioDuration: number;
  published: boolean;
  tryout: boolean;
  score: number | null;
  uniqueWordsNumber: number;
  /** Idioma do reader ('en' quando ausente — catálogo original) */
  lang?: string;
}

export interface Tip {
  text: string;
  translatedText: string;
  explanation: string | null;
}

export interface Translation {
  text: string;
  tips: Tip[];
}

// Segmento de furigana: `t` é um trecho do texto; `r` (hiragana) só existe
// nos trechos de kanji. A concatenação dos `t` reproduz Token.text.
export interface FuriSeg {
  t: string;
  r?: string;
}

export interface Token {
  text: string;
  newLine: boolean;
  translation: Translation | null;
  furigana?: FuriSeg[];
}

export interface ReaderContent {
  id: number;
  total: number;
  tokens: Token[];
}

export interface LevelMeta {
  id: number;
  /** Rótulo customizado do nível (ex.: "Real Books"); ausente → "Nível {id}" */
  name?: string;
  publishedReadersCount: number;
  available: boolean;
}

export interface ReadingStat {
  publishedReadersCount: number;
  userProgress: number;
  level: number;
  totalReadersFinished: number;
}
