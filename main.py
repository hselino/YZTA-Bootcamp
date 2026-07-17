import os
import time
import uuid
from pydantic import BaseModel, Field
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from parser import extract_text_from_file
from ai_service import cv_analiz_et_json


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


app = FastAPI(title="AI Career Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@app.get("/")
def health_check():
    return {"message": "AI Career Coach backend çalışıyor!"}


@app.post("/upload-cv", response_model=CVAnalizResponse)
async def upload_cv(
    file: UploadFile = File(...),
    hedef_rol: str = Form(None),
    test_modu: bool = Form(False),
):
    if not file.filename:
        raise HTTPException(400, "Dosya adı bulunamadı.")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Yalnızca PDF ve DOCX dosyaları kabul edilir.")

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

        result = cv_analiz_et_json(cv_text, hedef_rol=hedef_rol, test_modu=test_modu)

        if "hata" in result:
            raise HTTPException(500, result["hata"])

        return result
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
