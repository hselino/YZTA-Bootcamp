# AI Career Coach — Backend

FastAPI + Supabase (auth/db) + Gemini (AI). Calistirmak icin: `uvicorn main:app --reload`

Gerekli ortam degiskenleri (.env): `SUPABASE_URL`, `SUPABASE_KEY`, `AI_PROVIDER` (`gemini` onerilir), `GEMINI_API_KEY`, `CORS_ORIGINS`.

## Yeni: Mulakat Simulasyonu AI Akisi

1. `POST /interview/start` — body: `{ "position": "...", "difficulty": "Kolay|Orta|Zor", "test_modu": false }`
   AI, pozisyona ve zorluga gore 8 soruluk bir soru seti uretir, `interview_sessions` tablosuna kaydeder.
   Donen: `{ "interview_id", "position", "difficulty", "questions": [...] }`

2. `POST /interview/{interview_id}/answer` — multipart form: `question_index` (int), ve `audio` (dosya) **veya** `answer_text` (string).
   Ses gonderilirse Gemini sesi dogrudan dinleyip metne cevirir ve ayni cagrida degerlendirir (ayri bir speech-to-text servisi gerekmez).
   Donen: `{ "degerlendirme": { "transcript"?, "puan", "geri_bildirim", "guclu_nokta", "gelistirme_onerisi", "ornek_daha_iyi_cevap" }, ... }`

3. `POST /interview/{interview_id}/finish` — tum cevaplanan sorulari toplayip genel bir performans raporu uretir,
   `interviews` tablosuna kaydeder ve oturumu `completed` yapar.
   Donen: `{ "puan_karnesi", "genel_degerlendirme", "guclu_yonler", "gelistirilmesi_gerekenler", "soru_bazli_ozet", "genel_tavsiye" }`

Gecmis: `GET /interviews` (liste), `GET /interviews/{id}` (detay + rapor).

Ses formatlari: mp3, wav, m4a, aac, ogg, flac, webm, 3gp (max 15MB).

## Yeni: LinkedIn Optimizasyonu AI Akisi

`POST /linkedin/analyze` — body: `{ "headline"?, "about"?, "experience"?: string[], "skills"?: string[], "hedef_rol"?, "cv_metni"?, "test_modu": false }`
En az bir alan dolu olmali. `cv_metni` verilirse (ornegin daha once /upload-cv'den donen metin), AI bos birakilan LinkedIn alanlarini CV'den referansla doldurmaya calisir.

Donen: `{ "puan_karnesi", "ozet_degerlendirme", "guclu_yonler", "gelistirme_alanlari", "onerilen_basliklar": string[3], "onerilen_hakkimda", "anahtar_kelime_onerileri", "bolum_onerileri": { "deneyim", "beceriler", "one_cikanlar" } }`

Gecmis: `GET /linkedin/analyses` (liste), `GET /linkedin/analyses/{id}` (detay).

## Mimari notu

- `ai_service.py` — CV analizi (mevcut, degistirilmedi).
- `ai_client.py` — LinkedIn ve mulakat servislerinin ortak Gemini/Groq istemcisi (metin + ses girdisi destekler).
- `linkedin_service.py`, `interview_service.py` — prompt + AI cagrisi, `main.py`'daki endpoint'ler bunlari cagirir.
- Tum yeni servisler `test_modu=True` ile calisir; AI'a gitmeden aninda ornek veri doner (frontend gelistirme/test icin, API anahtari gerekmez).
- Yeni tablolar icin `supabase_migration_ai_features.sql` dosyasini Supabase SQL Editor'da calistirin.
