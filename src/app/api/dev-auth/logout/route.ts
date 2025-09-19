import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('uid', '', { path: '/', maxAge: 0 });
  res.cookies.set('email', '', { path: '/', maxAge: 0 });
  return res;
}