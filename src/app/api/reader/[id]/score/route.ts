import { NextRequest, NextResponse } from 'next/server';
import { getScore, setScore } from '@/lib/data';

// Espelha o original: GET -> {scoreValue, creationDate}; POST {scoreValue} -> true
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(getScore(Number(id)));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const score = Number(body.scoreValue);
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: 'scoreValue inválido' }, { status: 400 });
  }
  setScore(Number(id), score);
  return NextResponse.json(true);
}
