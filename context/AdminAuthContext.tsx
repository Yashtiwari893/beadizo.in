'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (key: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

/**
 * Admin auth state.
 *
 * The session itself lives in an HttpOnly, signed cookie that JavaScript
 * cannot read or forge. This context only mirrors that state for rendering —
 * it is NOT the authority. Setting `isAuthenticated` by hand from the console
 * now reveals nothing, because every admin page request and every admin API
 * call is verified server-side (see middleware.ts and lib/auth/session.ts).
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      setIsAuthenticated(Boolean(data?.authenticated));
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-check when the tab regains focus, so an expired session surfaces
  // promptly instead of failing on the next save.
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const login = async (key: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key.trim().slice(0, 256) }),
        credentials: 'same-origin',
      });

      if (res.ok) {
        setIsAuthenticated(true);
        return { ok: true };
      }

      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        return { ok: false, error: data.error || 'Too many attempts. Please wait before trying again.' };
      }
      return { ok: false, error: data.error || 'Incorrect admin security key.' };
    } catch {
      return { ok: false, error: 'Could not reach the server. Check your connection and try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE', credentials: 'same-origin' });
    } catch {
      // Even if the request fails, drop local state and let middleware redirect.
    }
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
