import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getProfile, saveProfile } from '../services/api';

const defaultProfile = {
  name: '',
  education: '',
  target_role: '',
  experience: '',
  support_needs: [],
};

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { token, isLoading: isAuthLoading } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!token) {
      setProfile(defaultProfile);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getProfile(token);
      setProfile({ ...defaultProfile, ...(data || {}) });
    } catch (err) {
      setProfile(defaultProfile);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthLoading) return;
    refetch();
  }, [isAuthLoading, refetch]);

  // Onboarding'in son ekranı "experience" alanını set ediyor - o dolmadan
  // onboarding tamamlanmamış sayılır. Profil sunucuda (Supabase) tutulduğu
  // için hesaba özel; farklı bir hesapla girişte otomatik doğru değeri verir.
  const hasOnboarded = !!profile.experience;

  // Onboarding ekranları her adımda kendi alanlarını kısmi olarak kaydeder.
  const saveProfileStep = async (partialData) => {
    await saveProfile(partialData, token);
    setProfile((prev) => ({ ...prev, ...partialData }));
  };

  const value = useMemo(
    () => ({ profile, hasOnboarded, isLoading, saveProfileStep, refetchProfile: refetch }),
    [profile, hasOnboarded, isLoading, refetch]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
};
