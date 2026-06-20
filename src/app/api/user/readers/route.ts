import { NextRequest, NextResponse } from 'next/server';
import { queryReaders } from '@/lib/data';

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = queryReaders({
    level: Number(sp.get('filter.level') ?? 1),
    readingStatus: sp.get('filter.readingStatus') ?? 'All',
    skip: Number(sp.get('paging.skip') ?? 0),
    take: Number(sp.get('paging.take') ?? 10),
    orderBy: sp.get('paging.orderBy') ?? '',
    lang: sp.get('filter.lang') ?? 'en',
  });
  return NextResponse.json(data);
}
