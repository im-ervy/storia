import { NextRequest, NextResponse } from 'next/server';
import { finishReader } from '@/lib/data';

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  finishReader(Number(id));
  return new NextResponse(null, { status: 204 });
}
