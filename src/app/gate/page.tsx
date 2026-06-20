'use client';

import { useState, type FormEvent } from 'react';

export default function GatePage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const from = new URLSearchParams(window.location.search).get('from') || '/';
        // hard navigation para o middleware reavaliar com o cookie já setado
        window.location.href = from;
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0e1116',
        color: '#e8eaed',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        padding: 24,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#171b22',
          border: '1px solid #262c36',
          borderRadius: 14,
          padding: 32,
          boxShadow: '0 12px 40px rgba(0,0,0,.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26 }}>🔒</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '8px 0 4px' }}>
            Acesso restrito
          </h1>
          <p style={{ fontSize: 14, color: '#9aa3af', margin: 0 }}>
            Digite a senha para entrar.
          </p>
        </div>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          aria-label="Senha"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            fontSize: 16,
            background: '#0e1116',
            border: `1px solid ${error ? '#e5484d' : '#2c333d'}`,
            borderRadius: 9,
            color: '#e8eaed',
            outline: 'none',
          }}
        />

        {error && (
          <p style={{ color: '#ff6b6e', fontSize: 13, margin: 0 }}>
            Senha incorreta. Tente novamente.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: 15,
            fontWeight: 600,
            border: 'none',
            borderRadius: 9,
            cursor: loading || !password ? 'default' : 'pointer',
            color: '#fff',
            background: loading || !password ? '#2b5fb0' : '#3b82f6',
            opacity: loading || !password ? 0.6 : 1,
            transition: 'background .15s, opacity .15s',
          }}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
