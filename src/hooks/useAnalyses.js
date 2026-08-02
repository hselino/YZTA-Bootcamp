import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAnalyses, ApiError } from '../services/api';

// Kullanıcının geçmiş analizlerini backend'den (Supabase "analyses" tablosu) çeker.
export function useAnalyses() {
  const { token } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalyses(token);
      setAnalyses(data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analizler yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { analyses, isLoading, error, refetch };
}
