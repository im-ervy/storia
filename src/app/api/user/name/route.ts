import { NextResponse } from 'next/server';
import { setUserName } from '@/lib/data';
import { USER_NAME_COOKIE, readUserName } from '@/lib/userName';

export async function GET() {
  return NextResponse.json({ name: await readUserName() });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const name = (body.name ?? '').trim().slice(0, 40);
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  setUserName(name); // mantém o comportamento em dev local
  const res = NextResponse.json({ name });
  // Persiste no navegador (ver userName.ts p/ o porquê do cookie). Não é dado
  // sensível, então não precisa ser HttpOnly.
  res.cookies.set(USER_NAME_COOKIE, encodeURIComponent(name), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 ano
  });
  return res;
}
