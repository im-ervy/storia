import { NextResponse } from 'next/server';
import { getUserLevels } from '@/lib/data';

export function GET() {
  return NextResponse.json(getUserLevels());
}
