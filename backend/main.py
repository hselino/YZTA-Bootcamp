from fastapi import FastAPI
from fastapi import FastAPI, UploadFile, File
import fitz  # PyMuPDF, garip ama import ismi böyle
import docx
import io
from supabase import create_client
import os
from dotenv import load_dotenv

app = FastAPI()
load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase = create_client(supabase_url, supabase_key)
@app.get("/")
def read_root():
    return {"message": "AI Career Coach backend çalışıyor!"}

@app.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
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