'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(key);
    if (!result.ok) {
      // Surface the server's message verbatim so rate-limit lockouts are clear,
      // while never revealing whether the key was close to correct.
      setError(result.error || 'Incorrect Admin Security Key. Please verify your credentials.');
      setKey('');
      setLoading(false);
    } else {
      router.replace('/admin');
      router.refresh();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#FFFFFF',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#141419',
          border: '1px solid rgba(223, 189, 181, 0.2)',
          borderRadius: '12px',
          padding: '40px 32px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <img
            src="/logo.png"
            alt="Beadizo Admin CMS"
            style={{ height: '48px', objectFit: 'contain', margin: '0 auto 12px' }}
          />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#DFBDB5',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} /> Official CMS Portal
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              color: '#FFFFFF',
              marginTop: '8px',
            }}
          >
            Admin Sign In
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#A6A6B2', marginTop: '4px' }}>
            Enter your security key to manage products, pricing, and live content.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#F87171',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#DFBDB5',
                marginBottom: '6px',
                fontWeight: 600,
              }}
            >
              Admin Security Key
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                maxLength={256}
                autoComplete="current-password"
                name="admin-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter password / PIN..."
                style={{
                  width: '100%',
                  height: '46px',
                  background: '#1F1F26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '0 40px 0 14px',
                  color: '#FFFFFF',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#DFBDB5',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '46px',
              background: '#DFBDB5',
              color: '#0A0A0C',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <Loader2 size={16} className="lucide-spin" />
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.75rem',
            color: '#7E7E8F',
          }}
        >
          Protected by Beadizo Shield • Server verified access only
        </div>
      </div>
    </div>
  );
}
