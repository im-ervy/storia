import { NextResponse } from 'next/server';
import { markRead } from '@/lib/data';

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string; pos: string }> }
) {
  const { id, pos } = await params;
  markRead(Number(id), Number(pos));
  return new NextResponse(null, { status: 200 });
}
