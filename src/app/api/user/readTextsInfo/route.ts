import { NextResponse } from 'next/server';
import { getReadTextsInfo } from '@/lib/data';

export function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get('lang') ?? undefined;
  return NextResponse.json(getReadTextsInfo(lang));
}
