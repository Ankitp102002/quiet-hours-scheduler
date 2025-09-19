import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookieStore = await cookies();
  cookieStore.set('uid', '', { path: '/', maxAge: 0 });
  cookieStore.set('email', '', { path: '/', maxAge: 0 });
  return res;
}