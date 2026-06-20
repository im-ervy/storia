import { NextRequest, NextResponse } from 'next/server';
import { getSentences } from '@/lib/data';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const index = Number(sp.get('index') ?? 0);
  const size = Number(sp.get('size') ?? 200);
  return NextResponse.json(getSentences(Number(id), index, size));
}
