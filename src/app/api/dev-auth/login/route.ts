import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }
  const uid = randomUUID();
  const res = NextResponse.json({ ok: true, uid, email });
  res.cookies.set('uid', uid, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  res.cookies.set('email', email, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}