// Backend URL'i .env dosyasından okunur (bkz. .env.example).
// Varsayılan, ekibin ortak Railway deployment'ı - kendi local backend'inle
// test edeceksen .env dosyanda EXPO_PUBLIC_API_URL ile override et.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://ai-career-coach-production-7df0.up.railway.app';
