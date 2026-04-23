import { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';

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
