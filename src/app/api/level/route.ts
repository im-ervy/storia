import { NextRequest, NextResponse } from 'next/server';
import { getLevels } from '@/lib/data';

export function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') ?? 'en';
  return NextResponse.json(getLevels(lang));
}
