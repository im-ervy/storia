import { NextResponse } from 'next/server';

const PASSWORD = process.env.SITE_PASSWORD;
const COOKIE = 'gr_gate';

export async function POST(req: Request) {
  // Sem senha configurada → porta desativada (a middleware já libera tudo).
  if (!PASSWORD) {
    return NextResponse.json({ ok: true });
  }

  let password = '';
  try {
    ({ password } = await req.json());
  } catch {
    /* corpo inválido */
  }

  if (password !== PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
  return res;
}
