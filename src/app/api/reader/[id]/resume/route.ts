import { NextRequest, NextResponse } from 'next/server';
import { getResume } from '@/lib/data';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const size = Number(req.nextUrl.searchParams.get('size') ?? 200);
  return NextResponse.json(getResume(Number(id), size));
}
