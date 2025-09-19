import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET() {
  const u = getUserFromCookies();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(u);
}