from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Header
import fitz  # PyMuPDF
import docx
import io
from supabase import create_client
import os
from dotenv import load_dotenv

from ai_service import cv_analiz_et_json

app = FastAPI()
load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)

@app.get("/")
def read_root():
    return {"message": "AI Career Coach backend çalışıyor!"}

def verify_token(authorization: str = Header(...)):
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Gecersiz token turu")

        # Token'ı Supabase Auth üzerinden doğrula ve kullanıcıyı al
        user_response = supabase.auth.get_user(token)
        return user_response.user  # User nesnesi döner, id alanı UUID'dir
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Gecersiz veya suresi dolmus token: {str(e)}")

@app.post("/register")
def register(email: str, password: str, name: str):
    try:
        # Admin API ile olustur: sign_up'in aksine onay maili gondermez ve
        # kullaniciyi aninda onaylanmis (email_confirm=True) olarak acar.
        # Bu proje icin e-posta dogrulama akisi gerekmiyor.
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "name": name
            }
        })
        return {"message": "Kullanici basariyla kaydedildi", "user": response.user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Kayit hatasi: {str(e)}")

@app.post("/login")
def login(email: str, password: str):
    try:
        # Supabase Auth ile giriş yap
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return {
            "message": "Giris basarili",
            "access_token": response.session.access_token,
            "token_type": "bearer",
            "email": response.user.email,
            "name": response.user.user_metadata.get("name") if response.user.user_metadata else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Giris hatasi: {str(e)}")

@app.post("/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    hedef_rol: str = Form(None),
    test_modu: bool = Form(False),
    user=Depends(verify_token),
):
    content = await file.read()
    text = ""

    if file.filename.endswith(".pdf"):
        pdf = fitz.open(stream=content, filetype="pdf")
        for page in pdf:
            text += page.get_text()

    elif file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content))
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"

    else:
        raise HTTPException(400, "Sadece PDF veya DOCX dosyaları destekleniyor")

    supabase.table("cv_uploads").insert({
        "filename": file.filename,
        "content_text": text,
    }).execute()

    ai_result = cv_analiz_et_json(text, hedef_rol=hedef_rol, test_modu=test_modu)
    if "hata" in ai_result:
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

    return ai_result

@app.get("/test-db")
def test_db():
    return {"message": "Supabase baglantisi kuruldu", "url": supabase_url}

@app.get("/analyses")
def get_analyses(user=Depends(verify_token)):
    response = supabase.table("analyses").select("id", "file_name", "score_general", "created_at").eq("user_id", user.id).execute()
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
