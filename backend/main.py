import os
import io
import logging
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import fitz
import docx
from supabase import create_client
from dotenv import load_dotenv

from ai_service import cv_analiz_et_json

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("ai-career-coach")

load_dotenv()

app = FastAPI(title="AI Career Coach API", version="3.0.0")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)


def _fresh_admin_client():
    return create_client(supabase_url, supabase_key)

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

@app.get("/")
def read_root():
    logger.info("Health check")
    return {"message": "AI Career Coach backend çalışıyor!", "version": "3.0.0", "status": "healthy"}

def verify_token(authorization: str = Header(...)):
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Gecersiz token turu")
        user_response = supabase.auth.get_user(token)
        return user_response.user
    except HTTPException:
        raise
    except Exception:
        logger.exception("Token dogrulama hatasi")
        raise HTTPException(status_code=401, detail="Gecersiz veya suresi dolmus token")

@app.post("/register")
def register(email: str, password: str, name: str):
    try:
        response = _fresh_admin_client().auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "name": name
            }
        })
        logger.info("Yeni kullanici kaydedildi: %s", email)
        return {"message": "Kullanici basariyla kaydedildi", "user": response.user}
    except Exception:
        logger.error("Kayit hatasi: %s", email)
        raise HTTPException(status_code=400, detail="Kayit sirasinda bir hata olustu")

@app.post("/login")
def login(email: str, password: str):
    try:
        response = _fresh_admin_client().auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        logger.info("Kullanici girisi: %s", email)
        return {
            "message": "Giris basarili",
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "email": response.user.email,
        }
    except Exception:
        logger.error("Giris hatasi: %s", email)
        raise HTTPException(status_code=401, detail="Email veya sifre hatali")

@app.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    hedef_rol: str = Form(None),
    test_modu: bool = Form(False),
    user=Depends(verify_token),
):
    if not file.filename:
        raise HTTPException(400, "Dosya adi bulunamadi")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Yalnizca PDF ve DOCX dosyalari kabul edilir")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "Dosya boyutu 10MB'dan buyuk olamaz")

    text = ""
    if file_ext == ".pdf":
        pdf = fitz.open(stream=content, filetype="pdf")
        for page in pdf:
            text += page.get_text()
    elif file_ext == ".docx":
        doc = docx.Document(io.BytesIO(content))
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"

    if not text.strip():
        raise HTTPException(400, "Dosyadan metin cikarilamadi")

    supabase.table("cv_uploads").insert({
        "filename": file.filename,
        "content_text": text,
    }).execute()

    logger.info("CV analizi basliyor | hedef_rol=%s | test_modu=%s", hedef_rol or "yok", test_modu)
    ai_result = cv_analiz_et_json(text, hedef_rol=hedef_rol, test_modu=test_modu)

    if "hata" in ai_result:
        logger.error("AI analiz hatasi: %s", ai_result["hata"])
        raise HTTPException(500, ai_result["hata"])

    scorecard = ai_result["puan_karnesi"]
    supabase.table("analyses").insert({
        "user_id": user.id,
        "file_name": file.filename,
        "target_role": hedef_rol,
        "score_general": scorecard["genel_puan"],
        "score_ats": scorecard["ats_uyumu"],
        "score_technical": scorecard["teknik_beceri"],
        "score_impact": scorecard["etki_odaklilik"],
        "summary": ai_result["ozet_degerlendirme"],
        "role_suitability": ai_result["hedef_role_uygunluk"],
        "strengths": ai_result["guclu_yonler"],
        "gaps_and_solutions": ai_result["eksikler_ve_cozumler"],
        "improvement_suggestions": ai_result["duzeltme_onerileri"],
    }).execute()

    logger.info("CV analizi tamamlandi | kullanici=%s", user.id)
    return ai_result

@app.get("/health")
def health():
    return {"message": "Supabase baglantisi aktif", "status": "ok"}

@app.get("/analyses")
def get_analyses(user=Depends(verify_token)):
    response = (
        supabase.table("analyses")
        .select("id", "file_name", "score_general", "created_at")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data

def _row_to_analysis_response(row: dict) -> dict:
    # DB satırını /upload-cv ile aynı CVAnalizResponse şekline çevirir,
    # böylece frontend tek bir sonuç şeması kullanır.
    return {
        "puan_karnesi": {
            "genel_puan": row["score_general"],
            "ats_uyumu": row["score_ats"],
            "teknik_beceri": row["score_technical"],
            "etki_odaklilik": row["score_impact"],
        },
        "ozet_degerlendirme": row["summary"],
        "hedef_role_uygunluk": row["role_suitability"],
        "guclu_yonler": row["strengths"],
        "eksikler_ve_cozumler": row["gaps_and_solutions"],
        "duzeltme_onerileri": row["improvement_suggestions"],
    }


@app.get("/analyses/{analysis_id}")
def get_analysis_detail(analysis_id: str, user=Depends(verify_token)):
    response = supabase.table("analyses").select("*").eq("id", analysis_id).eq("user_id", user.id).execute()
    if len(response.data) == 0:
        raise HTTPException(status_code=404, detail="Analiz bulunamadi veya bu analize erisim yetkiniz yok")
    return _row_to_analysis_response(response.data[0])

@app.get("/roadmaps")
def get_roadmaps(user=Depends(verify_token)):
    response = supabase.table("roadmaps").select("*").eq("user_id", user.id).order("step_order").execute()
    return response.data

@app.get("/interviews")
def get_interviews(user=Depends(verify_token)):
    response = supabase.table("interviews").select("*").eq("user_id", user.id).execute()
    return response.data

@app.post("/interviews")
def save_interview(position: str, difficulty: str, questions: list, answers: list, user=Depends(verify_token)):
    data = {
        "user_id": user.id,
        "position": position,
        "difficulty": difficulty,
        "questions": questions,
        "answers": answers
    }
    response = supabase.table("interviews").insert(data).execute()
    return {"message": "Mulakat basariyla kaydedildi", "data": response.data}
