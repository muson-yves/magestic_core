import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const BuyerContext = createContext(null);

export function BuyerProvider({ children }) {
  const [buyer,     setBuyer]     = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [checking,  setChecking]  = useState(true);

  const refreshCart = async () => {
    try {
      const r = await api.get('/cart');
      setCartCount(r.data.reduce((s, i) => s + i.qty, 0));
    } catch { setCartCount(0); }
  };

  useEffect(() => {
    api.get('/buyer/me')
      .then(r => {
        if (r.data.loggedIn) { setBuyer(r.data); refreshCart(); }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/buyer/login', { email, password });
    setBuyer(r.data);
    await refreshCart();
    return r.data;
  };

  const register = async (name, email, password) => {
    const r = await api.post('/buyer/register', { name, email, password });
    setBuyer(r.data);
    setCartCount(0);
    return r.data;
  };

  const logout = async () => {
    await api.post('/buyer/logout');
    setBuyer(null);
    setCartCount(0);
  };

  return (
    <BuyerContext.Provider value={{ buyer, cartCount, checking, login, register, logout, refreshCart }}>
      {children}
    </BuyerContext.Provider>
  );
}

export const useBuyer = () => useContext(BuyerContext);
