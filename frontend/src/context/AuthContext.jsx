import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { ToastContext } from './ToastContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Access toast context to control polling lifecycle
  const toastCtx = useContext(ToastContext);

  useEffect(() => {
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('token', data.token);
    setUser(data);
    // Start polling after login
    toastCtx?.startPolling?.();
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('token', data.token);
    setUser(data);
    toastCtx?.startPolling?.();
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    // Stop polling after logout
    toastCtx?.stopPolling?.();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
