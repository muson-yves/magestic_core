import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.get('/admin/me')
      .then(r => setLoggedIn(r.data.loggedIn))
      .catch(() => setLoggedIn(false))
      .finally(() => setChecking(false));
  }, []);

  const login = async (username, password) => {
    await api.post('/admin/login', { username, password });
    setLoggedIn(true);
  };

  const logout = async () => {
    await api.post('/admin/logout');
    setLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
