import os
from pypdf import PdfReader
from docx import Document

def extract_text_from_file(file_path: str) -> str:
    """
    Verilen dosya yoluna göre PDF veya DOCX içindeki metni çıkarır.
    """
    if not os.path.exists(file_path):
        return "Hata: Dosya bulunamadı!"
        
    file_extension = file_path.lower().split('.')[-1]
    text = ""

    # PDF Dosyalarını Okuma
    if file_extension == 'pdf':
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        except Exception as e:
            return f"PDF okuma hatası: {str(e)}"

    # DOCX (Word) Dosyalarını Okuma
    elif file_extension == 'docx':
        try:
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            return f"DOCX okuma hatası: {str(e)}"
            
    else:
        return "Hata: Desteklenmeyen dosya formatı! Lütfen PDF veya DOCX yükleyin."

    # Gereksiz boşlukları temizleyelim
    return text.strip()

# --- TEST EDELİM ---
if __name__ == "__main__":
    # Test etmek için proje klasörüne örnek bir cv.pdf koyabiliriz
    ornek_dosya = "ornek_cv.pdf" 
    
    cikti = extract_text_from_file(ornek_dosya)
    print("--- ÇIKARILAN METİN ---")
    print(cikti[:500]) # Sadece ilk 500 karakteri ekrana basalım, çalıştığını görelim.