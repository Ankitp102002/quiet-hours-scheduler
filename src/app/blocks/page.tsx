'use client';

import { useEffect, useState } from 'react';

type Block = {
  _id: string;
  title?: string;
  startAt: string;
  endAt: string;
  timezone?: string;
};

type Me = { id: string; email: string };

export default function BlocksPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [msg, setMsg] = useState<string | null>(null);

  const loadMe = async () => {
    const res = await fetch('/api/dev-auth/me');
    if (res.ok) setMe(await res.json());
    else setMe(null);
  };

  const loadBlocks = async () => {
    const res = await fetch('/api/blocks');
    if (res.ok) setBlocks(await res.json());
    else setBlocks([]);
  };

  useEffect(() => { loadMe(); }, []);
  useEffect(() => { if (me) loadBlocks(); }, [me]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!startAt || !endAt) {
      setMsg('Please select start and end times');
      return;
    }
    const payload = {
      title: title || undefined,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      timezone,
    };
    const res = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setTitle('');
      setStartAt('');
      setEndAt('');
      await loadBlocks();
      setMsg('Quiet hours created!');
    } else {
      const err = await res.json().catch(() => ({}));
      setMsg(err.error || 'Error creating block');
    }
  };

  const del = async (id: string) => {
    if (confirm('Delete this quiet hour block?')) {
      const res = await fetch(`/api/blocks/${id}`, { method: 'DELETE' });
      if (res.ok) loadBlocks();
    }
  };

  if (!me) {
    return (
      <div>
        <h1>My Quiet Hours</h1>
        <p>Please <a href="/login">login</a> first.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>My Quiet Hours</h1>
      <p>Logged in as: {me.email}</p>
      
      <div style={{ background: '#364558', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h2>Create New Quiet Hours</h2>
        <form onSubmit={create} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label>Title (optional):</label>
            <input 
              placeholder="e.g., Study for exam" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          
          <div>
            <label>Start time:</label>
            <input 
              type="datetime-local" 
              value={startAt} 
              onChange={e => setStartAt(e.target.value)} 
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          
          <div>
            <label>End time:</label>
            <input 
              type="datetime-local" 
              value={endAt} 
              onChange={e => setEndAt(e.target.value)} 
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          
          <div>
            <label>Timezone:</label>
            <input 
              value={timezone} 
              onChange={e => setTimezone(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          
          <button type="submit" style={{ padding: 12, background: '#0070f3', color: 'white', border: 'none', borderRadius: 4 }}>
            Create Quiet Hours
          </button>
          {msg && <p style={{ color: msg.includes('Error') ? 'red' : 'green' }}>{msg}</p>}
        </form>
      </div>

      <h2>Your Scheduled Quiet Hours</h2>
      {blocks.length === 0 ? (
        <p>No quiet hours scheduled yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {blocks.map(b => (
            <li key={b._id} style={{ background: '#f9f9f9', padding: 12, marginBottom: 8, borderRadius: 4 }}>
              <strong>{b.title || 'Quiet Hours'}</strong>
              <br />
              {new Date(b.startAt).toLocaleString()} → {new Date(b.endAt).toLocaleString()}
              <br />
              <small>Timezone: {b.timezone || 'UTC'}</small>
              <button 
                onClick={() => del(b._id)} 
                style={{ marginLeft: 8, padding: '4px 8px', background: '#ff4444', color: 'white', border: 'none', borderRadius: 4 }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}