import { NextResponse } from 'next/server';
import { getReader } from '@/lib/data';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reader = getReader(Number(id));
  if (!reader) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...reader, isTransient: false });
}
