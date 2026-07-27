import os
import asyncio
import time
import uuid
import logging
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn

from parser import extract_text_from_file
from ai_service import cv_analiz_et_json, AI_PROVIDER, GROQ_API_KEY, GEMINI_API_KEY

load_dotenv()

executor = ThreadPoolExecutor(max_workers=2)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai-career-coach")


class Scorecard(BaseModel):
    genel_puan: int = Field(..., ge=0, le=100, description="CV genel kalitesi")
    ats_uyumu: int = Field(..., ge=0, le=100, description="Format, başlıklar, anahtar kelime uyumu")
    teknik_beceri: int = Field(..., ge=0, le=100, description="Teknik yetkinlik ve araç bilgisi")
    etki_odaklilik: int = Field(..., ge=0, le=100, description="Sonuç ve başarı odaklı anlatım")


class EksikCozum(BaseModel):
    eksik: str = Field(..., description="Tespit edilen eksiklik")
    cozum: str = Field(..., description="Pratik çözüm önerisi")


class DuzeltmeOnerileri(BaseModel):
    eklenmeli: list[str] = Field(..., description="CV'ye eklenmesi gerekenler")
    cikarilmali: list[str] = Field(..., description="CV'den çıkarılması gerekenler")
    guncellenmeli: list[str] = Field(..., description="CV'de güncellenmesi gerekenler")


class CVAnalizResponse(BaseModel):
    puan_karnesi: Scorecard
    ozet_degerlendirme: str = Field(..., description="Kapsamlı özet değerlendirme")
    hedef_role_uygunluk: str = Field(..., description="Role uygunluk değerlendirmesi")
    guclu_yonler: list[str] = Field(..., description="Güçlü yönler listesi")
    eksikler_ve_cozumler: list[EksikCozum] = Field(..., description="Eksiklikler ve çözüm önerileri")
    duzeltme_onerileri: DuzeltmeOnerileri = Field(..., description="Kategorize edilmiş düzeltme önerileri")


app = FastAPI(title="AI Career Coach API", description="CV analiz ve kariyer koçluğu API'si", version="3.0.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Beklenmeyen hata: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Sunucuda beklenmeyen bir hata oluştu."},
    )


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@app.get("/", tags=["Health"])
def health_check():
    logger.info("Health check çağrıldı")
    ai_provider_status = "configured" if (AI_PROVIDER == "gemini" and GEMINI_API_KEY) or (GROQ_API_KEY) else "missing_api_key"
    return {
        "message": "AI Career Coach backend çalışıyor!",
        "version": "3.0.0",
        "status": "healthy",
        "ai_provider": AI_PROVIDER,
        "ai_provider_status": ai_provider_status,
    }


@app.post("/upload-cv", response_model=CVAnalizResponse, tags=["CV Analizi"])
@limiter.limit("5/minute")
async def upload_cv(
    request: Request,
    file: UploadFile = File(...),
    hedef_rol: str = Form(None, max_length=200),
    test_modu: bool = Form(False),
):
    if not file.filename:
        raise HTTPException(400, "Dosya adı bulunamadı.")

    filename = os.path.basename(file.filename)
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(400, "Geçersiz dosya adı.")

    file_ext = os.path.splitext(filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Yalnızca PDF ve DOCX dosyaları kabul edilir. Gönderilen: {file_ext}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "Dosya boyutu 10MB'dan büyük olamaz.")

    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{file_ext}")
    try:
        with open(file_path, "wb") as f:
            f.write(content)

        cv_text = extract_text_from_file(file_path)
        if not cv_text or len(cv_text.strip()) < 50:
            raise HTTPException(400, "CV'den metin çıkarılamadı. Dosyayı kontrol edin.")

        logger.info("CV analizi başlıyor | hedef_rol=%s | test_modu=%s", hedef_rol or "yok", test_modu)

        result = await asyncio.get_event_loop().run_in_executor(
            executor, cv_analiz_et_json, cv_text, hedef_rol, test_modu
        )

        if "hata" in result:
            logger.error("AI analiz hatası: %s", result["hata"])
            raise HTTPException(500, result["hata"])

        try:
            validated = CVAnalizResponse(**result)
        except Exception as e:
            logger.error("AI yanıtı Pydantic validasyonundan geçemedi: %s", e)
            raise HTTPException(502, "AI analiz yanıtı beklenen formatta değil. Lütfen tekrar deneyin.")

        logger.info("CV analizi başarıyla tamamlandı")
        return validated
    finally:
        for _ in range(3):
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                break
            except PermissionError:
                time.sleep(0.5)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
