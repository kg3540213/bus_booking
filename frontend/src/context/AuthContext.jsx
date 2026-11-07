import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('algions_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('algions_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi.getProfile()
        .then((res) => {
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('algions_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const saveAuth = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('algions_user', JSON.stringify(userData));
    localStorage.setItem('algions_token', tokenStr);
  };

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success) {
      saveAuth(res.data.user, res.data.token);
    }
    return res;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    if (res.success) {
      saveAuth(res.data.user, res.data.token);
    }
    return res;
  };

  const demoLogin = async (role) => {
    const res = await authApi.demoLogin(role);
    if (res.success) {
      saveAuth(res.data.user, res.data.token);
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('algions_user');
    localStorage.removeItem('algions_token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    demoLogin,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isOperator: user?.role === 'OPERATOR',
    isCustomer: user?.role === 'CUSTOMER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
