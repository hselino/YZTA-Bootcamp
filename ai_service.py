import os
import json
from dotenv import load_dotenv  # Yeni ekledik!
from groq import Groq
from parser import extract_text_from_file

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("❌ HATA: GROQ_API_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.")

client = Groq(api_key=API_KEY)

def cv_analiz_et_json(cv_metni: str):
    """
    CV metnini analiz eder ve Frontend'de kullanılmak üzere SADECE JSON formatında veri döndürür.
    """
    print("🤖 AI CV'yi detaylı inceliyor (JSON modunda)...")
    
    sistem_promptu = """
    Sen öğrencilerin kariyer gelişimine odaklanan profesyonel ve yardımcı bir AI Kariyer Koçusun.
    Görevin sana verilen CV metnini incelemek ve öğrencilere yapıcı, net, eyleme geçirilebilir geri bildirimler vermektir.
    
    KURALLAR:
    1. Çıktıyı SADECE geçerli bir JSON formatında ver. JSON dışında hiçbir giriş, gelişme cümlesi veya markdown kodu kullanma.
    2. Bütün cevapların TÜRKÇE olsun.
    3. JSON şeman KESİNLİKLE aşağıdaki anahtarlara (key) sahip olmalıdır:
    {
        "genel_puan": (0 ile 100 arasında bir sayı),
        "ozet_degerlendirme": "CV hakkında 2-3 cümlelik genel ve motive edici bir değerlendirme",
        "guclu_yonler": ["Güçlü nokta 1", "Güçlü nokta 2"],
        "eksikler_ve_cozumler": [
            {"eksik": "Tespit edilen eksiklik", "cozum": "Nasıl düzeltilebileceğine dair pratik tavsiye"}
        ],
        "onerilen_kariyer_yollari": ["Bu CV'ye uygun kariyer veya pozisyon önerisi 1", "Öneri 2"],
        "linkedin_tavsiyeleri": ["LinkedIn profilini güçlendirmek için 1-2 tüyo"]
    }
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": sistem_promptu},
                {"role": "user", "content": f"Aşağıdaki öğrenci CV'sini analiz et ve JSON olarak döndür:\n\n{cv_metni}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3, # Daha tutarlı ve kurallara uyan cevaplar için düşürdük
            
            response_format={"type": "json_object"} 
        )
        
        # Gelen metni Python sözlüğüne (dictionary) çeviriyoruz
        gelen_json_metni = chat_completion.choices[0].message.content
        analiz_sonucu = json.loads(gelen_json_metni)
        
        return analiz_sonucu
        
    except Exception as e:
        return {"hata": f"AI analizi sırasında bir hata oluştu: {str(e)}"}

# --- TEST EDELİM ---
if __name__ == "__main__":
    dosya_yolu = "ornek_cv.pdf" 
    cv_yazilari = extract_text_from_file(dosya_yolu)
    
    if "Hata:" not in cv_yazilari:
        sonuc = cv_analiz_et_json(cv_yazilari)
        
        # JSON'u ekrana süslü (okunaklı) bir şekilde yazdıralım
        print("\n--- 🎯 FRONTEND'E GİDECEK TEMİZ JSON VERİSİ ---")
        print(json.dumps(sonuc, indent=4, ensure_ascii=False))
        
        # Örnek: Verilere nasıl tek tek ulaşabiliriz?
        print("\n--- ÖRNEK KULLANIM ---")
        print("Adayın CV Puanı:", sonuc.get("genel_puan", "Hesaplanamadı"))
        print("Özet:", sonuc.get("ozet_degerlendirme", ""))
    else:
        print("❌ Dosya okunamadı:", cv_yazilari)