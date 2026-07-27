
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header
import fitz  # PyMuPDF, garip ama import ismi böyle
import docx
import io
from supabase import create_client
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

app = FastAPI()
load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
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

        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Gecersiz veya suresi dolmus token")
    
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

    response = supabase.table("cv_uploads").insert(data).execute()

    return {
        "filename": file.filename,
        "text_preview": text[:500],
        "saved_to_db": True
    }

@app.get("/test-db")
def test_db():
    return {"message": "Supabase baglantisi kuruldu", "url": supabase_url}

@app.post("/register")
def register(email: str, password: str, name: str):
    hashed_password = pwd_context.hash(password)

    data = {
        "email": email,
        "password_hash": hashed_password,
        "name": name
    }

    response = supabase.table("users").insert(data).execute()

    return {"message": "Kullanici basariyla kaydedildi", "email": email}


@app.post("/login")
def login(email: str, password: str):
    response = supabase.table("users").select("*").eq("email", email).execute()

    if len(response.data) == 0:
        return {"error": "Kullanici bulunamadi"}

    user = response.data[0]

    if not pwd_context.verify(password, user["password_hash"]):
        return {"error": "Sifre yanlis"}

    token = create_access_token({"sub": user["email"]})

    return {
        "message": "Giris basarili",
        "access_token": token,
        "token_type": "bearer",
        "email": user["email"],
        "name": user["name"]
    }


def get_user_id_by_email(email: str):
    response = supabase.table("users").select("id").eq("email", email).execute()
    if len(response.data) == 0:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")
    return response.data[0]["id"]


@app.get("/analyses")
def get_analyses(user=Depends(verify_token)):
    user_id = get_user_id_by_email(user.get("sub"))
    response = supabase.table("analyses").select("id", "file_name", "score_general", "created_at").eq("user_id", user_id).execute()
    return response.data


@app.get("/analyses/{analysis_id}")
def get_analysis_detail(analysis_id: str, user=Depends(verify_token)):
    user_id = get_user_id_by_email(user.get("sub"))
    response = supabase.table("analyses").select("*").eq("id", analysis_id).eq("user_id", user_id).execute()
    if len(response.data) == 0:
        raise HTTPException(status_code=404, detail="Analiz bulunamadi veya bu analize erisim yetkiniz yok")
    return response.data[0]


@app.get("/roadmaps")
def get_roadmaps(user=Depends(verify_token)):
    user_id = get_user_id_by_email(user.get("sub"))
    response = supabase.table("roadmaps").select("*").eq("user_id", user_id).order("step_order").execute()
    return response.data


@app.get("/interviews")
def get_interviews(user=Depends(verify_token)):
    user_id = get_user_id_by_email(user.get("sub"))
    response = supabase.table("interviews").select("*").eq("user_id", user_id).execute()
    return response.data


@app.post("/interviews")
def save_interview(position: str, difficulty: str, questions: list, answers: list, user=Depends(verify_token)):
    user_id = get_user_id_by_email(user.get("sub"))
    data = {
        "user_id": user_id,
        "position": position,
        "difficulty": difficulty,
        "questions": questions,
        "answers": answers
    }
    response = supabase.table("interviews").insert(data).execute()
    return {"message": "Mulakat basariyla kaydedildi", "data": response.data}