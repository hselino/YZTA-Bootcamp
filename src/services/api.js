import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { API_BASE_URL } from '../config/env';

// Backend: ekibin ortak Railway deployment'ı (bkz. src/config/env.js).
const ENDPOINTS = {
  register: '/register',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  uploadCv: '/upload-cv',
  analyses: '/analyses',
  profile: '/profile',
  linkedinAnalyze: '/linkedin/analyze',
  linkedinAnalyses: '/linkedin/analyses',
  interviewStart: '/interview/start',
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// AuthContext bunu login sırasında kaydeder; token süresi dolmuş/geçersiz bir
// isteğe rastladığımızda oturumu otomatik kapatıp kullanıcıyı Login'e döndürür
// (aksi halde ham "Geçersiz veya süresi dolmuş token" hatası ekranda kalıyordu).
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, options = {}, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(`${API_BASE_URL}${path}`, options);
  } catch (err) {
    console.error('[api] fetch basarisiz:', API_BASE_URL + path, err);
    throw new ApiError('Sunucuya ulaşılamadı. Backend adresini ve bağlantınızı kontrol edin.', 0);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const hadAuthHeader = !!options.headers?.Authorization;
    if (response.status === 401 && hadAuthHeader) {
      onUnauthorized?.();
    }
    throw new ApiError(body?.detail || 'İstek başarısız oldu.', response.status);
  }

  return body;
}

// Not: backend'de /login ve /register email/password'u query parametresi
// olarak alıyor (JSON body değil).
function withQuery(path, params) {
  const query = new URLSearchParams(params).toString();
  return `${path}?${query}`;
}

// Response: { message, access_token, token_type, email } — isim burada dönmüyor,
// GET /profile'dan alınıyor (bkz. UserContext).
export function login(email, password) {
  return request(withQuery(ENDPOINTS.login, { email, password }), { method: 'POST' });
}

// Response: { message, user }. Supabase varsayılan ayarında e-posta onayı
// gerekiyor — kayıttan sonra login, onay tamamlanana kadar başarısız olur.
export function register(email, password, name) {
  return request(withQuery(ENDPOINTS.register, { email, password, name }), { method: 'POST' });
}

// Kayıtlı bir email ise Supabase 6 haneli bir sıfırlama kodu gönderir.
// Güvenlik amacıyla email kayıtlı olmasa da aynı başarı mesajı döner.
export function forgotPassword(email) {
  return request(withQuery(ENDPOINTS.forgotPassword, { email }), { method: 'POST' });
}

// token: email ile gelen 6 haneli kod. Kod doğruysa şifre güncellenir.
export function resetPassword(email, token, newPassword) {
  return request(ENDPOINTS.resetPassword, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, new_password: newPassword }),
  });
}

// file: { uri, name, mimeType } — expo-document-picker sonucu.
// hedefRol: kullanıcının hedeflediği pozisyon (opsiyonel).
// token: login'den dönen access_token — /upload-cv auth zorunlu tutuyor.
//
// Not: Expo SDK 57, FormData.append'e eski {uri, name, type} nesnesini vermeyi
// artık desteklemiyor ("Unsupported FormDataPart implementation" hatası verir).
// Bunun yerine expo-file-system'in Blob uyumlu File sınıfı + expo/fetch kullanılıyor
// (bkz. https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/).
export function uploadCv(file, { hedefRol, testModu, token } = {}) {
  const formData = new FormData();
  // Üçüncü argüman: File.name önbellek yolundan türediği için (örn. bir UUID)
  // gerçek dosya adını (expo-document-picker'dan gelen) burada açıkça veriyoruz.
  formData.append('file', new File(file.uri), file.name);
  if (hedefRol) formData.append('hedef_rol', hedefRol);
  if (testModu) formData.append('test_modu', 'true');

  return request(
    ENDPOINTS.uploadCv,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    },
    expoFetch
  );
}

// Geçmiş analiz listesi — { id, file_name, score_general, created_at }[]
export function getAnalyses(token) {
  return request(ENDPOINTS.analyses, { headers: { Authorization: `Bearer ${token}` } });
}

// Tek analiz detayı — /upload-cv ile aynı CVAnalizResponse şeklinde döner.
export function getAnalysisDetail(id, token) {
  return request(`${ENDPOINTS.analyses}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

// Onboarding profili — { name, education, target_role, experience, support_needs }.
// Alanlar opsiyonel/nullable; kayıtlı olmayanlar hiç dönmeyebilir.
export function getProfile(token) {
  return request(ENDPOINTS.profile, { headers: { Authorization: `Bearer ${token}` } });
}

// Kısmi güncelleme yapar — sadece gönderilen alanlar değişir, diğerleri korunur.
// Onboarding'in her ekranı kendi alanlarıyla ayrı ayrı çağırır.
export function saveProfile(data, token) {
  return request(ENDPOINTS.profile, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// data: { headline, about, experience: string[], skills: string[], hedef_rol, cv_metni }
// En az bir alan dolu olmalı. Backend hedef_rol/eğitim/deneyimi profilden de tamamlar.
export function linkedinAnalyze(data, token) {
  return request(ENDPOINTS.linkedinAnalyze, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

// Geçmiş LinkedIn analizleri — { id, score_general, target_role, created_at }[]
export function getLinkedinAnalyses(token) {
  return request(ENDPOINTS.linkedinAnalyses, { headers: { Authorization: `Bearer ${token}` } });
}

// Tek analiz detayı — linkedinAnalyze ile aynı şekilde döner.
export function getLinkedinAnalysisDetail(id, token) {
  return request(`${ENDPOINTS.linkedinAnalyses}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

// Yeni mülakat oturumu başlatır, sorular üretir.
// Response: { interview_id, position, difficulty, questions: string[] }
export function startInterview({ position, difficulty }, token) {
  return request(ENDPOINTS.interviewStart, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ position, difficulty }),
  });
}

// Tek bir soruya yazılı cevap gönderir, o soru için AI değerlendirmesini döner.
// Response: { question_index, total_questions, answered_count, degerlendirme }
export function submitInterviewAnswer(interviewId, { questionIndex, answerText }, token) {
  const formData = new FormData();
  formData.append('question_index', String(questionIndex));
  formData.append('answer_text', answerText);

  return request(`/interview/${interviewId}/answer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

// Mülakatı sonlandırır, genel performans raporunu döner.
export function finishInterview(interviewId, token) {
  return request(`/interview/${interviewId}/finish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Geçmiş mülakat özetleri — { id, position, difficulty, overall_score, created_at }[]
export function getInterviews(token) {
  return request('/interviews', { headers: { Authorization: `Bearer ${token}` } });
}

// Tek mülakat detayı — sorular, cevaplar ve tam rapor dahil ham kayıt.
export function getInterviewDetail(id, token) {
  return request(`/interviews/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}
