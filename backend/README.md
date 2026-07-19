# AI Career Coach - Backend

CV metnini Google Gemini API ile analiz eden, 0-100 arası skor üreten ve kısa
kariyer önerisi oluşturan FastAPI servisi.

## Kurulum

### 1. Gereksinimler
- Python 3.12+

### 2. Sanal ortam oluştur ve bağımlılıkları kur

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### 3. Gemini API key ekle

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) üzerinden ücretsiz bir API key oluştur.
2. `.env.example` dosyasını `.env` olarak kopyala ve key'ini içine yaz:

```
GEMINI_API_KEY=senin_api_keyin
GEMINI_MODEL=gemini-2.5-flash
```

`.env` dosyası `.gitignore`'da — asla commit etme.

### 4. Sunucuyu başlat

```bash
./.venv/Scripts/python.exe -m uvicorn main:app --reload
```

Sunucu `http://127.0.0.1:8000` adresinde çalışır. İnteraktif dokümantasyon
için `http://127.0.0.1:8000/docs` adresine git.

## Proje yapısı

| Dosya | Açıklama |
|---|---|
| `main.py` | FastAPI uygulaması, endpoint tanımları |
| `cv_analysis.py` | CV metnini Gemini'ye gönderip yapılandırılmış analiz üretir |
| `scoring.py` | Kategori skorlarından ağırlıklı genel skor (0-100) hesaplar |
| `career.py` | Analiz sonucundan kısa kariyer önerisi üretir |
| `test_scoring.py` | Skorlama mantığı için birim testleri |
| `test_main.py` | API endpoint'leri için entegrasyon testleri |

## Endpoint'ler

### `GET /health`
Servisin ayakta olduğunu doğrular.

```json
{"status": "ok"}
```

### `POST /analyze-cv`
CV metnini analiz eder, kategori bazlı skorlar ve genel skor döner.

**İstek:**
```json
{
  "cv_text": "CV metni buraya",
  "target_role": "Backend Developer"
}
```

**Cevap:**
```json
{
  "overall_score": 91,
  "category_scores": {
    "teknik_beceriler": 95,
    "deneyim": 85,
    "egitim": 98,
    "format_sunum": 85,
    "soft_skills": 90
  },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."]
}
```

### `POST /career-suggestion`
Analiz sonucundaki güçlü/zayıf yönlere göre kısa kariyer önerisi üretir.

**İstek:**
```json
{
  "strengths": ["Python bilgisi"],
  "weaknesses": ["Deneyim eksikliği"],
  "category_scores": {
    "teknik_beceriler": 70,
    "deneyim": 40,
    "egitim": 80,
    "format_sunum": 60,
    "soft_skills": 50
  },
  "target_role": "Data Analyst"
}
```

**Cevap:**
```json
{
  "summary": "Kısa özet metni",
  "next_steps": ["Adım 1", "Adım 2", "..."]
}
```

## Testleri çalıştırma

```bash
./.venv/Scripts/python.exe -m pytest -v
```

Not: `test_analyze_cv_valid_returns_200` ve `test_career_suggestion_valid_returns_200`
gerçek Gemini API'sine istek atar — `.env` dosyasında geçerli bir
`GEMINI_API_KEY` olması gerekir.
