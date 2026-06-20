// Estado do usuário (progresso + notas), persistido em AsyncStorage — o
// equivalente mobile do data/userState.json do servidor. O estado-base "lido"
// (9 livros, 1.275 palavras únicas) vem do campo `times` do catálogo, igual ao
// web; este store só acumula o progresso/avaliações desta instalação por cima.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Progress {
  position: number; // índice do último token lido
  times: number;
  finished: boolean;
}
export interface UserScore {
  scoreValue: number;
  creationDate: string;
}

const STATE_KEY = 'gr-user-state';

const progress = new Map<number, Progress>();
const scores = new Map<number, UserScore>();
let userName = '';
let hydrated = false;

export async function hydrate(): Promise<void> {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as {
        progress?: Record<string, Progress>;
        scores?: Record<string, UserScore>;
        userName?: string;
      };
      for (const [id, p] of Object.entries(s.progress ?? {})) progress.set(Number(id), p);
      for (const [id, sc] of Object.entries(s.scores ?? {})) scores.set(Number(id), sc);
      userName = typeof s.userName === 'string' ? s.userName : '';
    }
  } catch {
    /* estado corrompido: começa do zero */
  }
  hydrated = true;
}

async function persist(): Promise<void> {
  const s = {
    userName,
    progress: Object.fromEntries(progress),
    scores: Object.fromEntries(scores),
  };
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
}

export function getUserName(): string {
  return userName;
}
export function setUserName(name: string): void {
  userName = name.trim().slice(0, 40);
  void persist();
}

export function getProgress(id: number): Progress | undefined {
  return progress.get(id);
}
export function setProgress(id: number, p: Progress): void {
  progress.set(id, p);
  void persist();
}
export function getStoredScore(id: number): UserScore | undefined {
  return scores.get(id);
}
export function setStoredScore(id: number, sc: UserScore): void {
  scores.set(id, sc);
  void persist();
}
