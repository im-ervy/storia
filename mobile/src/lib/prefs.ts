// Preferências simples (idioma, tema de leitura, modo ruby), persistidas em
// AsyncStorage. Espelha as chaves de localStorage do app web.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANG_KEY = 'gr-lang';
export const THEME_KEY = 'gr-color-theme';
export const PINYIN_KEY = 'gr-pinyin';
export const NOTES_KEY = 'gr-notes-highlight';

export interface LangOption {
  code: string;
  label: string;
  /** voz TTS (BCP-47) */
  speech: string;
}

// Idiomas disponíveis (mesma lista do seletor de perfil no Header do web).
export const LANGS: LangOption[] = [
  { code: 'en', label: 'Inglês', speech: 'en-US' },
  { code: 'fr', label: 'Francês', speech: 'fr-FR' },
  { code: 'es', label: 'Espanhol', speech: 'es-ES' },
  { code: 'it', label: 'Italiano', speech: 'it-IT' },
  { code: 'zh', label: 'Mandarim', speech: 'zh-CN' },
  { code: 'ru', label: 'Russo', speech: 'ru-RU' },
  { code: 'ja', label: 'Japonês', speech: 'ja-JP' },
];

export function speechLangOf(lang: string): string {
  return LANGS.find((l) => l.code === lang)?.speech ?? 'en-US';
}

export async function getPref(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setPref(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
