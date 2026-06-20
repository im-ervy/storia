// Contexto global: idioma ativo (gr-lang) + gate de hidratação do estado do
// usuário (AsyncStorage). Espelha o seletor de idioma do perfil no web.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { hydrate, getUserName, setUserName as persistName } from '../lib/store';
import { LANG_KEY, getPref, setPref } from '../lib/prefs';

interface AppState {
  ready: boolean;
  lang: string;
  setLang: (lang: string) => void;
  userName: string;
  setUserName: (name: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lang, setLangState] = useState('en');
  const [userName, setNameState] = useState('');

  useEffect(() => {
    (async () => {
      await hydrate();
      const saved = await getPref(LANG_KEY);
      if (saved) setLangState(saved);
      setNameState(getUserName());
      setReady(true);
    })();
  }, []);

  const setLang = (next: string) => {
    setLangState(next);
    void setPref(LANG_KEY, next);
  };

  const setUserName = (name: string) => {
    persistName(name);
    setNameState(getUserName());
  };

  return (
    <Ctx.Provider value={{ ready, lang, setLang, userName, setUserName }}>{children}</Ctx.Provider>
  );
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return v;
}
