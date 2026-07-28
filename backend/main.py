from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header
import fitz  # PyMuPDF
import docx
import io
from supabase import create_client
import os
from dotenv import load_dotenv
from pydantic import BaseModel

app = FastAPI()

class ProfileCreate(BaseModel):
    full_name: str
    education_status: str
    target_role: str
    experience_level: str
    support_needs: list[str]

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
        # Supabase Auth ile kullanıcı oluştur, name bilgisini metadata olarak ekle
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "name": name
                }
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
async def upload_cv(file: UploadFile = File(...), user=Depends(verify_token)):
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
        return {"error": "Sadece PDF veya DOCX dosyaları destekleniyor"}

    data = {
        "filename": file.filename,
        "content_text": text
    }

    # Not: cv_uploads tablosuna kaydederken user_id eklemek isterseniz:
    # data["user_id"] = user.id
    response = supabase.table("cv_uploads").insert(data).execute()

    return {
        "filename": file.filename,
        "text_preview": text[:500],
        "saved_to_db": True
    }

@app.get("/test-db")
def test_db():
    return {"message": "Supabase baglantisi kuruldu", "url": supabase_url}

@app.get("/analyses")
def get_analyses(user=Depends(verify_token)):
    response = supabase.table("analyses").select("id", "file_name", "score_general", "created_at").eq("user_id", user.id).execute()
    return response.data

@app.get("/analyses/{analysis_id}")
def get_analysis_detail(analysis_id: str, user=Depends(verify_token)):
    response = supabase.table("analyses").select("*").eq("id", analysis_id).eq("user_id", user.id).execute()
    if len(response.data) == 0:
        raise HTTPException(status_code=404, detail="Analiz bulunamadi veya bu analize erisim yetkiniz yok")
    return response.data[0]

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


@app.post("/profile")
def create_or_update_profile(profile: ProfileCreate, user=Depends(verify_token)):
    try:
        data = {
            "id": user.id,
            "full_name": profile.full_name,
            "education_status": profile.education_status,
            "target_role": profile.target_role,
            "experience_level": profile.experience_level,
            "support_needs": profile.support_needs
        }
        # upsert, kayıt varsa günceller, yoksa yeni kayıt oluşturur.
        response = supabase.table("profiles").upsert(data).execute()
        return {"message": "Profil basariyla kaydedildi", "profile": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Profil kayit hatasi: {str(e)}")


@app.get("/profile")
def get_profile(user=Depends(verify_token)):
    try:
        response = supabase.table("profiles").select("*").eq("id", user.id).execute()
        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Profil bulunamadi. Onboarding tamamlanmamis olabilir.")
        return response.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profil getirme hatasi: {str(e)}")

