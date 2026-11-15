import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('nexbus_token'));
  const [user, setUser] = useState(() => {
    if (!localStorage.getItem('nexbus_token')) return null;
    const saved = localStorage.getItem('nexbus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi.getProfile()
        .then((res) => {
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('nexbus_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      localStorage.removeItem('nexbus_user');
      setLoading(false);
    }
  }, [token]);

  const saveAuth = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('nexbus_user', JSON.stringify(userData));
    localStorage.setItem('nexbus_token', tokenStr);
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
    localStorage.removeItem('nexbus_user');
    localStorage.removeItem('nexbus_token');
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

