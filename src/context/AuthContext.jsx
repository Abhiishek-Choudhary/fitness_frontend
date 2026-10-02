import { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from '../services/api.js';

const AuthContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':  return { user: action.user };
    case 'LOGOUT': return { user: null };
    default:       return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { user: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try { dispatch({ type: 'LOGIN', user: JSON.parse(saved) }); } catch { /* corrupt data */ }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const onExpired = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback((userData) => {
    dispatch({ type: 'LOGIN', user: userData });
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    dispatch({ type: 'LOGOUT' });
  }, []);

  if (!ready) return null;

  return (
    <AuthContext.Provider value={{ user: state.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
