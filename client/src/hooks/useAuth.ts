import { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'waiter' | 'kitchen' | 'bar' | 'cashier';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(getApiUrl('/api/auth/me'), {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (pin: string, _username: string | null, _role: string) => {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ pin })
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      return { success: true, user: data.user };
    } else {
      const error = await res.json();
      return { success: false, error: error.error };
    }
  };

  const logout = async () => {
    try {
      await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  return { user, loading, login, logout, checkAuth };
}

