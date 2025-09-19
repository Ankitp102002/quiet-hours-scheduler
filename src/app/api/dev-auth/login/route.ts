import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }
  const uid = randomUUID();
  const res = NextResponse.json({ ok: true, uid, email });
  const cookieStore = await cookies();
  cookieStore.set('uid', uid, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  cookieStore.set('email', email, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}