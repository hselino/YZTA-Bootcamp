import os
import io
import logging
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import fitz
import docx
from supabase import create_client
from dotenv import load_dotenv

from ai_service import cv_analiz_et_json
from linkedin_service import linkedin_analiz_et_json
from interview_service import mulakat_sorulari_uret, cevap_degerlendir, mulakat_raporu_olustur

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

MAX_AUDIO_SIZE = 15 * 1024 * 1024
AUDIO_MIME_BY_EXTENSION = {
    ".mp3": "audio/mp3",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".mp4": "audio/mp4",
    ".aac": "audio/aac",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".webm": "audio/webm",
    ".3gp": "audio/3gpp",
}

class ProfileData(BaseModel):
    name: Optional[str] = None
    education: Optional[str] = None
    target_role: Optional[str] = None
    experience: Optional[str] = None
    support_needs: Optional[list[str]] = None


class LinkedInProfileData(BaseModel):
    headline: Optional[str] = None
    about: Optional[str] = None
    experience: Optional[list[str]] = None
    skills: Optional[list[str]] = None
    hedef_rol: Optional[str] = None
    cv_metni: Optional[str] = None
    test_modu: bool = False


class InterviewStartRequest(BaseModel):
    position: str
    difficulty: str
    test_modu: bool = False

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

    meta = getattr(user, "user_metadata", {}) or {}
    egitim = meta.get("education")
    deneyim = meta.get("experience")
    if not hedef_rol:
        hedef_rol = meta.get("target_role")

    logger.info("CV analizi basliyor | hedef_rol=%s | test_modu=%s | egitim=%s | deneyim=%s", hedef_rol or "yok", test_modu, egitim or "yok", deneyim or "yok")
    ai_result = cv_analiz_et_json(text, hedef_rol=hedef_rol, test_modu=test_modu, egitim=egitim, deneyim=deneyim)

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
    response = (
        supabase.table("interviews")
        .select("id", "position", "difficulty", "overall_score", "created_at")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data

@app.get("/interviews/{interview_id}")
def get_interview_detail(interview_id: str, user=Depends(verify_token)):
    response = supabase.table("interviews").select("*").eq("id", interview_id).eq("user_id", user.id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Mulakat bulunamadi veya bu mulakata erisim yetkiniz yok")
    return response.data[0]


@app.post("/interview/start")
def start_interview(req: InterviewStartRequest, user=Depends(verify_token)):
    meta = getattr(user, "user_metadata", {}) or {}
    egitim = meta.get("education")
    deneyim = meta.get("experience")
    hedef_rol = meta.get("target_role")

    logger.info("Mulakat sorulari uretiliyor | pozisyon=%s | zorluk=%s | kullanici=%s", req.position, req.difficulty, user.id)
    sorular_sonucu = mulakat_sorulari_uret(
        pozisyon=req.position,
        zorluk=req.difficulty,
        hedef_rol=hedef_rol,
        egitim=egitim,
        deneyim=deneyim,
        test_modu=req.test_modu,
    )
    if "hata" in sorular_sonucu:
        logger.error("Mulakat soru uretim hatasi: %s", sorular_sonucu["hata"])
        raise HTTPException(status_code=500, detail=sorular_sonucu["hata"])

    sorular = sorular_sonucu["sorular"]
    insert_response = supabase.table("interview_sessions").insert({
        "user_id": user.id,
        "position": req.position,
        "difficulty": req.difficulty,
        "questions": sorular,
        "answers": [],
        "status": "in_progress",
    }).execute()

    session_id = insert_response.data[0]["id"]
    logger.info("Mulakat oturumu olusturuldu | id=%s | kullanici=%s", session_id, user.id)
    return {"interview_id": session_id, "position": req.position, "difficulty": req.difficulty, "questions": sorular}


def _get_owned_session(interview_id: str, user_id: str) -> dict:
    response = supabase.table("interview_sessions").select("*").eq("id", interview_id).eq("user_id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Mulakat oturumu bulunamadi")
    return response.data[0]


@app.post("/interview/{interview_id}/answer")
async def submit_interview_answer(
    interview_id: str,
    question_index: int = Form(...),
    answer_text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    test_modu: bool = Form(False),
    user=Depends(verify_token),
):
    session = _get_owned_session(interview_id, user.id)
    if session["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Bu mulakat oturumu zaten tamamlanmis")

    sorular = session["questions"]
    if question_index < 0 or question_index >= len(sorular):
        raise HTTPException(status_code=400, detail="Gecersiz soru numarasi")

    cevaplanmis_indexler = {a["question_index"] for a in session["answers"]}
    if question_index in cevaplanmis_indexler:
        raise HTTPException(status_code=400, detail="Bu soru zaten cevaplandi")

    audio_bytes = None
    audio_mime = None
    if audio is not None:
        if not audio.filename:
            raise HTTPException(status_code=400, detail="Ses dosyasi adi bulunamadi")
        file_ext = os.path.splitext(audio.filename)[1].lower()
        if file_ext not in AUDIO_MIME_BY_EXTENSION:
            raise HTTPException(status_code=400, detail="Desteklenmeyen ses formati")
        audio_bytes = await audio.read()
        if len(audio_bytes) > MAX_AUDIO_SIZE:
            raise HTTPException(status_code=400, detail="Ses dosyasi boyutu 15MB'dan buyuk olamaz")
        audio_mime = audio.content_type or AUDIO_MIME_BY_EXTENSION[file_ext]
    elif not answer_text or not answer_text.strip():
        raise HTTPException(status_code=400, detail="Ses kaydi veya yazili cevap gonderilmeli")

    soru = sorular[question_index]
    logger.info("Cevap degerlendiriliyor | oturum=%s | soru_no=%s | ses=%s", interview_id, question_index, bool(audio_bytes))
    degerlendirme = cevap_degerlendir(
        soru=soru,
        pozisyon=session["position"],
        zorluk=session["difficulty"],
        cevap_metni=answer_text,
        audio_bytes=audio_bytes,
        audio_mime=audio_mime,
        test_modu=test_modu,
    )
    if "hata" in degerlendirme:
        logger.error("Cevap degerlendirme hatasi: %s", degerlendirme["hata"])
        raise HTTPException(status_code=500, detail=degerlendirme["hata"])

    yeni_cevap = {
        "question_index": question_index,
        "soru": soru,
        "cevap_metni": answer_text,
        "degerlendirme": degerlendirme,
    }
    guncel_answers = session["answers"] + [yeni_cevap]
    supabase.table("interview_sessions").update({"answers": guncel_answers}).eq("id", interview_id).execute()

    return {
        "question_index": question_index,
        "total_questions": len(sorular),
        "answered_count": len(guncel_answers),
        "degerlendirme": degerlendirme,
    }


@app.post("/interview/{interview_id}/finish")
def finish_interview(interview_id: str, test_modu: bool = False, user=Depends(verify_token)):
    session = _get_owned_session(interview_id, user.id)
    if session["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Bu mulakat oturumu zaten tamamlanmis")
    if not session["answers"]:
        raise HTTPException(status_code=400, detail="Mulakati bitirmeden once en az bir soru cevaplanmali")

    logger.info("Mulakat raporu olusturuluyor | oturum=%s | kullanici=%s", interview_id, user.id)
    rapor = mulakat_raporu_olustur(
        pozisyon=session["position"],
        zorluk=session["difficulty"],
        soru_cevap_degerlendirmeleri=session["answers"],
        test_modu=test_modu,
    )
    if "hata" in rapor:
        logger.error("Mulakat rapor hatasi: %s", rapor["hata"])
        raise HTTPException(status_code=500, detail=rapor["hata"])

    genel_puan = rapor["puan_karnesi"]["genel_puan"]
    supabase.table("interview_sessions").update({"status": "completed", "report": rapor}).eq("id", interview_id).execute()
    supabase.table("interviews").insert({
        "user_id": user.id,
        "position": session["position"],
        "difficulty": session["difficulty"],
        "questions": session["questions"],
        "answers": session["answers"],
        "overall_score": genel_puan,
        "report": rapor,
    }).execute()

    logger.info("Mulakat tamamlandi | oturum=%s | genel_puan=%s", interview_id, genel_puan)
    return rapor

@app.post("/profile")
def save_profile(data: ProfileData, user=Depends(verify_token)):
    existing_meta = dict(getattr(user, "user_metadata", {}) or {})
    incoming = data.model_dump(exclude_none=True)
    merged = {**existing_meta, **incoming}
    _fresh_admin_client().auth.admin.update_user_by_id(user.id, {"user_metadata": merged})
    logger.info("Profil guncellendi: %s", user.id)
    return {"message": "Profil basariyla kaydedildi"}

@app.get("/profile")
def get_profile(user=Depends(verify_token)):
    meta = getattr(user, "user_metadata", {}) or {}
    fields = ["name", "education", "target_role", "experience", "support_needs"]
    return {k: meta.get(k) for k in fields if meta.get(k) is not None}


@app.post("/linkedin/analyze")
def analyze_linkedin(data: LinkedInProfileData, user=Depends(verify_token)):
    meta = getattr(user, "user_metadata", {}) or {}
    egitim = meta.get("education")
    deneyim = meta.get("experience")
    hedef_rol = data.hedef_rol or meta.get("target_role")

    logger.info("LinkedIn analizi basliyor | hedef_rol=%s | kullanici=%s", hedef_rol or "yok", user.id)
    sonuc = linkedin_analiz_et_json(
        headline=data.headline,
        about=data.about,
        experience=data.experience,
        skills=data.skills,
        hedef_rol=hedef_rol,
        egitim=egitim,
        deneyim=deneyim,
        cv_metni=data.cv_metni,
        test_modu=data.test_modu,
    )
    if "hata" in sonuc:
        logger.error("LinkedIn analiz hatasi: %s", sonuc["hata"])
        raise HTTPException(status_code=400, detail=sonuc["hata"])

    supabase.table("linkedin_analyses").insert({
        "user_id": user.id,
        "input_headline": data.headline,
        "input_about": data.about,
        "target_role": hedef_rol,
        "score_general": sonuc["puan_karnesi"]["genel_puan"],
        "result": sonuc,
    }).execute()

    logger.info("LinkedIn analizi tamamlandi | kullanici=%s", user.id)
    return sonuc


@app.get("/linkedin/analyses")
def get_linkedin_analyses(user=Depends(verify_token)):
    response = (
        supabase.table("linkedin_analyses")
        .select("id", "score_general", "target_role", "created_at")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data


@app.get("/linkedin/analyses/{analysis_id}")
def get_linkedin_analysis_detail(analysis_id: str, user=Depends(verify_token)):
    response = supabase.table("linkedin_analyses").select("*").eq("id", analysis_id).eq("user_id", user.id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Analiz bulunamadi veya bu analize erisim yetkiniz yok")
    return response.data[0]["result"]
