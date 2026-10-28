import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiService, getAccessToken, onAccessTokenChange, onSessionExpired } from '@/services/api';
import type { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Only the (non-secret) user profile is cached, to render the header instantly.
// Tokens are never written to storage any more.
const USER_CACHE_KEY = 'crf_user';

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: User | null) {
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
    // Clean up keys from the old version, which stored the token itself
    ['token', 'user'].forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
  } catch {
    /* storage unavailable (private mode) — nothing to do */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(readCachedUser);
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [loading, setLoading] = useState(true);

  const setCurrentUser = useCallback((u: User | null) => {
    setUser(u);
    cacheUser(u);
  }, []);

  // Keep React state in sync with the token the API layer holds
  useEffect(() => onAccessTokenChange(setToken), []);

  // On load, restore the session from the refresh cookie. Started during the
  // first render (not in an effect) so it's already in flight before any child
  // component makes an API call; those calls wait for it.
  // Skipped for visitors who have never signed in on this browser (saves a request
  // that would only return 401).
  const [bootstrap] = useState(() => (readCachedUser() ? apiService.refreshSession() : Promise.resolve(null)));
  useEffect(() => {
    bootstrap
      .then((session) => setCurrentUser(session ? session.user : null))
      .finally(() => setLoading(false));
  }, [bootstrap, setCurrentUser]);

  // Refresh cookie expired or revoked while using the app
  useEffect(() => {
    onSessionExpired(() => {
      if (readCachedUser()) toast.error('Your session has ended. Please sign in again.');
      setCurrentUser(null);
    });
  }, [setCurrentUser]);

  const login = async (email: string, password: string, rememberMe = true) => {
    const session = await apiService.login(email, password, rememberMe);
    setCurrentUser(session.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const session = await apiService.register(email, password, name);
    setCurrentUser(session.user);
  };

  const logout = async () => {
    try { await apiService.logout(); } catch { /* signed out locally anyway */ }
    setCurrentUser(null);
  };

  const acceptSession = (session: { user: User; token: string }) => setCurrentUser(session.user);

  return (
    <AuthContext.Provider
      value={{
        user, token, loading, login, register, logout,
        setCurrentUser: (u: User) => setCurrentUser(u),
        acceptSession,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
