import { cookies } from 'next/headers';

export async function getUserFromCookies() {
  const cookieStore = await cookies();
  const id = cookieStore.get('uid')?.value;
  const email = cookieStore.get('email')?.value;
  if (!id || !email) return null;
  return { id, email };
}