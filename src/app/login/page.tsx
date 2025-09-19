'use client';

import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [me, setMe] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/dev-auth/me');
      setMe(res.ok ? await res.json() : null);
    })();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/dev-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setMsg('Logged in!');
      setMe(await res.json());
      setTimeout(() => window.location.href = '/blocks', 1000);
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error || 'Login failed');
    }
  };

  const logout = async () => {
    await fetch('/api/dev-auth/logout', { method: 'POST' });
    setMe(null);
    setMsg('Logged out!');
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>Login</h1>
      {me ? (
        <>
          <p>Logged in as: {me.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <form onSubmit={login} style={{ display: 'grid', gap: 8 }}>
          <label>Enter your email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="you@example.com"
            required 
          />
          <button type="submit">Login</button>
          {msg && <p>{msg}</p>}
        </form>
      )}
    </div>
  );
}