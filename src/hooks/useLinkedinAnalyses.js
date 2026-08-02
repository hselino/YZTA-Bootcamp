import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLinkedinAnalyses, ApiError } from '../services/api';

// Kullanıcının geçmiş LinkedIn analizlerini backend'den ("linkedin_analyses" tablosu) çeker.
export function useLinkedinAnalyses() {
  const { token } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLinkedinAnalyses(token);
      setAnalyses(data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'LinkedIn analizleri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { analyses, isLoading, error, refetch };
}
