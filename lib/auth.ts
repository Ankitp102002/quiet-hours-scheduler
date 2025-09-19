import { cookies } from 'next/headers';

export function getUserFromCookies() {
  const c = cookies();
  const id = c.get('uid')?.value;
  const email = c.get('email')?.value;
  if (!id || !email) return null;
  return { id, email };
}