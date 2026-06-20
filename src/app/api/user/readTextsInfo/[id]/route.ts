import { NextRequest, NextResponse } from 'next/server';
import { getReadTextsInfo } from '@/lib/data';

// O original aplica as palavras do reader ao acumulado do usuário e devolve o
// novo total; aqui o cálculo é derivado dos readers terminados, então basta
// devolver o estado corrente (o finish já marcou o livro).
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  return NextResponse.json(getReadTextsInfo());
}
