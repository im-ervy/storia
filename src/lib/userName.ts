import { cookies } from 'next/headers';
import { getUserName } from './data';

// O nome do usuário é guardado num COOKIE (não em data/userState.json), porque
// no serverless da Vercel o filesystem é read-only e cada request pode cair
// numa instância nova — a memória do processo não persiste e o onboarding do
// nome entraria em loop. O cookie sobrevive entre requests do mesmo navegador.
export const USER_NAME_COOKIE = 'gr_user_name';

export async function readUserName(): Promise<string> {
  const v = (await cookies()).get(USER_NAME_COOKIE)?.value;
  if (v) return decodeURIComponent(v);
  return getUserName(); // fallback p/ dev local (processo único)
}
