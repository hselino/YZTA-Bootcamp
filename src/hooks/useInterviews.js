import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInterviews, ApiError } from '../services/api';

// Kullanıcının geçmiş mülakat özetlerini backend'den ("interviews" tablosu) çeker.
export function useInterviews() {
  const { token } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInterviews(token);
      setInterviews(data || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mülakat geçmişi yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { interviews, isLoading, error, refetch };
}
