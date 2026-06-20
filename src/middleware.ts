import { NextResponse, type NextRequest } from 'next/server';

// Porta de senha simples para o deploy (Vercel). A senha vem SÓ da env var
// SITE_PASSWORD (sem default hardcoded) e pode ser trocada no painel da Vercel
// sem redeploy. Se SITE_PASSWORD não estiver configurada, a porta fica
// desativada (acesso livre) — útil em dev/local.
const PASSWORD = process.env.SITE_PASSWORD;
const COOKIE = 'gr_gate';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Sem senha configurada → porta desativada.
  if (!PASSWORD) {
    return NextResponse.next();
  }

  // App desktop (Electron) roda 100% offline e empacotado — não tem porta de
  // senha (essa proteção é só do deploy web). O main.js sobe o Next com
  // GR_DESKTOP=1.
  if (process.env.GR_DESKTOP === '1') {
    return NextResponse.next();
  }

  // Libera a própria tela de senha, sua API, os internals do Next e qualquer
  // arquivo estático (tem extensão) — o resto exige o cookie de acesso.
  if (
    pathname.startsWith('/gate') ||
    pathname.startsWith('/api/gate') ||
    pathname.startsWith('/_next') ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (req.cookies.get(COOKIE)?.value === PASSWORD) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = '/gate';
  url.search = '';
  url.searchParams.set('from', pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
