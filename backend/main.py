from fastapi import FastAPI
from fastapi import FastAPI, UploadFile, File
import fitz  # PyMuPDF, garip ama import ismi böyle
import docx
import io

app = FastAPI()

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

    return {
        "filename": file.filename,
        "text_preview": text[:500]  # ilk 500 karakteri göster, tam metni değil
    }