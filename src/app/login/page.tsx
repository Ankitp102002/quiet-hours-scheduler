'use client';

import { useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [me, setMe] = useState<User | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/dev-auth/me');
      setMe(res.ok ? await res.json() : null);
    })();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    
    const res = await fetch('/api/dev-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (res.ok) {
      setMsg('Success! Redirecting...');
      setMe(await res.json());
      setTimeout(() => window.location.href = '/blocks', 1000);
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error || 'Login failed');
    }
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await fetch('/api/dev-auth/logout', { method: 'POST' });
    setMe(null);
    setMsg('Logged out successfully');
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {me ? 'Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600">
              {me ? 'Manage your account' : 'Sign in to manage your quiet hours'}
            </p>
          </div>

          {me ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-medium text-gray-900">{me.email}</p>
              </div>
              <button 
                onClick={logout} 
                disabled={loading}
                className="w-full btn-danger"
              >
                {loading ? 'Logging out...' : 'Logout'}
              </button>
              <a href="/blocks" className="block text-center text-blue-600 hover:text-blue-700">
                Go to My Schedule →
              </a>
            </div>
          ) : (
            <form onSubmit={login} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="you@example.com"
                  required
                  className="input-field"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              
              {msg && (
                <div className={`text-center text-sm ${msg.includes('Success') ? 'text-green-600' : 'text-red-600'}`}>
                  {msg}
                </div>
              )}
            </form>
          )}
          
          <p className="mt-6 text-center text-xs text-gray-500">
            This is a demo login for development purposes
          </p>
        </div>
      </div>
    </div>
  );
}