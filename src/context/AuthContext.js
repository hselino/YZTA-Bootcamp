import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, setUnauthorizedHandler } from '../services/api';

const STORAGE_KEY = 'aicareercoach.auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); // { token, email, name }
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setAuth(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = async (nextAuth) => {
    setAuth(nextAuth);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
  };

  const login = async (email, password) => {
    const response = await apiLogin(email, password);
    setSessionExpired(false);
    await persist({ token: response.access_token, email: response.email, name: response.name });
  };

  const register = async (email, password, name) => {
    await apiRegister(email, password, name);
  };

  const logout = async () => {
    setAuth(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  // Token süresi dolmuş/geçersiz bir isteğe rastlandığında (bkz. services/api.js)
  // oturumu otomatik kapatır; Login ekranı sessionExpired ile "tekrar giriş yap" mesajı gösterir.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSessionExpired(true);
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo(
    () => ({
      token: auth?.token ?? null,
      email: auth?.email,
      name: auth?.name,
      isAuthenticated: !!auth?.token,
      isLoading,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
      login,
      register,
      logout,
    }),
    [auth, isLoading, sessionExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
