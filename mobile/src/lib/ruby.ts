// Helpers de transliteração/ruby (porta do ReaderView web).
import type { Token } from './types';

export type RubyMode = 'furigana' | 'romaji' | 'translit' | 'off';

// Nos readers de mandarim, translation.text é "pinyin — tradução"; o pinyin
// (ou a translit no russo) vem antes do travessão.
const PINYIN_SEP = ' — ';
export function pinyinOf(t: Token): string | null {
  const tr = t.translation?.text;
  if (!tr) return null;
  const i = tr.indexOf(PINYIN_SEP);
  return i > 0 ? tr.slice(0, i) : null;
}

export function hasTranslitFor(lang: string): boolean {
  return lang === 'zh' || lang === 'ru' || lang === 'ja';
}

export function rubyModesFor(lang: string): RubyMode[] {
  if (lang === 'ja') return ['furigana', 'romaji', 'off'];
  if (hasTranslitFor(lang)) return ['translit', 'off'];
  return ['off'];
}

export const RUBY_LABEL: Record<RubyMode, string> = {
  furigana: 'ふりがな',
  romaji: 'Rōmaji',
  translit: 'abc',
  off: 'Off',
};

// Reading exibido acima do token no modo ruby atual. Para furigana, retorna os
// segmentos (kana só sobre os kanji); para os demais, o pinyin/translit do chunk.
export function readingOf(token: Token, mode: RubyMode): string | null {
  if (mode === 'off') return null;
  if (mode === 'furigana') {
    if (!token.furigana) return null;
    return token.furigana.map((s) => s.r ?? '').join('');
  }
  return pinyinOf(token);
}
