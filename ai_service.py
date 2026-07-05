import os
import json
from dotenv import load_dotenv
from groq import Groq


load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError("❌ HATA: GROQ_API_KEY bulunamadı! Lütfen .env dosyanızı kontrol edin.")

client = Groq(api_key=API_KEY)

def cv_analiz_et_json(cv_metni: str, hedef_rol: str = None, test_modu: bool = False):
    """
    CV metnini analiz eder.
    - test_modu=True ise Groq API limitini harcamadan anında sahte (mock) veri döner.
    - hedef_rol belirtilirse analizi ve eleştirileri tamamen o mesleğe özel yapar.
    """
    # 1. FRONTEND VE TEST MODU KORUMASI
    if test_modu:
        print("⚡ [TEST MODU AKTİF] AI'a gidilmedi, anında test verisi döndürülüyor...")
        return {
            "puan_karnesi": {
                "genel_puan": 78,
                "ats_uyumu": 85,
                "teknik_beceri": 75,
                "etki_odaklilik": 70
            },
            "ozet_degerlendirme": "[TEST MODU] Adayın teknik temeli iyi ancak projelerdeki etki ve sonuçlar daha net anlatılmalı.",
            "hedef_role_uygunluk": f"'{hedef_rol or 'Genel Yazılım'}' rolü için iyi bir başlangıç seviyesinde.",
            "guclu_yonler": [
                "Modern yazılım geliştirme araçlarına ve dillere hakimiyet",
                "Eğitim geçmişi ve teknik altyapısı sağlam"
            ],
            "eksikler_ve_cozumler": [
                {
                    "eksik": "Proje açıklamaları sadece ne yapıldığını anlatıyor, nasıl yapıldığı ve sonucu yok.",
                    "cozum": "STAR (Durum, Görev, Eylem, Sonuç) tekniği ile projelerinin yarattığı etkiyi detaylandır."
                }
            ],
            "linkedin_tavsiyeleri": [
                "GitHub linkini öne çıkar ve projelerinin Readme dosyalarını görselle zenginleştir.",
                "LinkedIn başlığına hedeflediğin rolü ('Student | Aspiring AI Engineer' gibi) net olarak ekle."
            ]
        }

    # 2. BOŞ VEYA BOZUK DOSYA KORUMASI (Validation)
    if not cv_metni or len(cv_metni.strip()) < 50:
        return {
            "hata": "⚠️ Yüklediğiniz dosya boş veya bir CV okunamadı! Lütfen en az 50 karakter içeren geçerli bir CV yükleyin."
        }

    print(f"🤖 AI CV'yi inceliyor... (Hedef Rol: {hedef_rol if hedef_rol else 'Genel Değerlendirme'})")
    
    # 3. PROFESYONEL PROMPT VE DETAYLI KARNE MANTIĞI
    rol_talimati = f"Adayın hedeflediği pozisyon: '{hedef_rol}'. BÜTÜN ELEŞTİRİLERİNİ VE ÖNERİLERİNİ BU MESLEĞE GÖRE YAP!" if hedef_rol else "Adayın hedeflediği özel bir rol belirtilmemiş, genel bir yazılım/teknoloji öğrencisi olarak değerlendir."

    sistem_promptu = f"""
    Sen öğrencilerin kariyer gelişimine odaklanan acımasız ama yapıcı bir AI Kariyer Koçusun.
    {rol_talimati}
    
    KURALLAR:
    1. Çıktıyı SADECE geçerli bir JSON formatında ver. JSON dışında hiçbir giriş, gelişme cümlesi veya markdown kodu kullanma.
    2. Bütün cevapların TÜRKÇE olsun.
    3. JSON şeman KESİNLİKLE aşağıdaki anahtarlara (key) sahip olmalıdır:
    {{
        "puan_karnesi": {{
            "genel_puan": (0 ile 100 arasında genel değerlendirme sayısı),
            "ats_uyumu": (0 ile 100 arasında ATS filtreleme sistemlerine uygunluk puanı),
            "teknik_beceri": (0 ile 100 arasında adayın teknik yetkinlik puanı),
            "etki_odaklilik": (0 ile 100 arasında adayın yaptığı işleri anlatma başarısı)
        }},
        "ozet_degerlendirme": "CV hakkında 2-3 cümlelik genel ve motive edici bir değerlendirme",
        "hedef_role_uygunluk": "Adayın hedeflediği role (veya genel sektöre) ne kadar hazır olduğuna dair 1-2 cümlelik net yorum",
        "guclu_yonler": ["Güçlü nokta 1", "Güçlü nokta 2"],
        "eksikler_ve_cozumler": [
            {{"eksik": "Tespit edilen eksiklik", "cozum": "Nasıl düzeltilebileceğine dair pratik tavsiye"}}
        ],
        "linkedin_tavsiyeleri": ["LinkedIn profilini güçlendirmek için 1-2 tüyo"]
    }}
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": sistem_promptu},
                {"role": "user", "content": f"Aşağıdaki öğrenci CV'sini analiz et ve JSON olarak döndür:\n\n{cv_metni}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            response_format={"type": "json_object"} 
        )
        return json.loads(chat_completion.choices[0].message.content)
        
    except Exception as e:
        return {"hata": f"AI analizi sırasında bir hata oluştu: {str(e)}"}

# --- LOKAL TEST İÇİN ---
if __name__ == "__main__":
    # Test 1: Mock Data Testi (API harcamaz)
    print("--- 1. MOCK DATA TESTİ ---")
    mock_sonuc = cv_analiz_et_json("Rastgele metin", hedef_rol="Siber Güvenlik", test_modu=True)
    print(json.dumps(mock_sonuc, indent=4, ensure_ascii=False))