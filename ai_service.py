import os
import json
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ai-career-coach")

AI_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

groq_client = None
genai_client = None

if AI_PROVIDER == "gemini":
    from google import genai as genai_sdk
    genai_client = genai_sdk.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
    logger.info("AI sağlayıcı: Gemini")
else:
    if GROQ_API_KEY:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("AI sağlayıcı: Groq")


def _build_prompt(hedef_rol=None):
    rol_talimati = (
        f"Hedef rol: '{hedef_rol}'. Tum analiz ve oneriler bu role gore yap."
        if hedef_rol
        else "Hedef rol belirtilmemis. CV'yi icerik, yapi, dil ve sunum kalitesi acisindan genel olarak degerlendir."
    )

    return f"""
Sen bir AI Kariyer Kocusun. {rol_talimati}

SADECE gecerli JSON dondur, baska hicbir sey yazma. Tum cikti TURKCE, dil bilgisi kurallarina uygun ve dogal olmali.

Puanlamada sert ol: 45-65 arasi normal CV, 66-75 iyi CV, 76-85 cok iyi CV, 86+ mucizevi CV.
Her guclu yon ve zayiflik CV'deki somut bir cumleye dayanmalidir.
Cozum onerileri somut ve uygulanabilir olmali (ornek cumle, format, sayi, arac ismi).
Duzeltme onerileri kategorilere ayrilmis, net ve uygulanabilir maddeler halinde olmali.

Semasi:
{{
    "puan_karnesi": {{
        "genel_puan": (0-100),
        "ats_uyumu": (0-100, format, basliklar, anahtar kelime),
        "teknik_beceri": (0-100, teknik yetkinlik),
        "etki_odaklilik": (0-100, sonuc ve basari odakli anlatim)
    }},
    "ozet_degerlendirme": "5-6 cumle. CV'nin guclu ve zayif yonlerini kapsamli ozetle",
    "hedef_role_uygunluk": "Hedef role uygunluk, hangi beceriler ortusuyor, hangileri eksik (rol yoksa genel degerlendirme)",
    "guclu_yonler": [
        "CV'den somut bir ornekle guclu yon"
    ],
    "eksikler_ve_cozumler": [
        {{"eksik": "CV'deki somut eksik (ornek cumle)", "cozum": "Adim adim duzeltme"}}
    ],
    "duzeltme_onerileri": {{
        "eklenmeli": ["CV'ye eklenmesi gerekenler"],
        "cikarilmali": ["CV'den cikarilmasi gerekenler"],
        "guncellenmeli": ["CV'de guncellenmesi gerekenler"]
    }}
}}
"""


def _analyze_with_groq(prompt, cv_metni):
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Asagidaki CV'yi analiz et ve JSON olarak dondur:\n\n{cv_metni}"},
        ],
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(chat_completion.choices[0].message.content)


def _analyze_with_gemini(prompt, cv_metni):
    from google.genai import types
    response = genai_client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=f"Asagidaki CV'yi analiz et ve JSON olarak dondur:\n\n{cv_metni}",
        config=types.GenerateContentConfig(
            system_instruction=prompt,
            temperature=0.3,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


MAX_CV_TOKENS = 8000


def _truncate_cv(cv_metni: str, max_chars: int = MAX_CV_TOKENS * 4) -> str:
    if len(cv_metni) > max_chars:
        logger.warning("CV metni %d karakter (max %d), kırpılıyor...", len(cv_metni), max_chars)
        return cv_metni[:max_chars] + "\n\n--- [METIN KISALTILDI, DEVAMI OKUNAMADI] ---"
    return cv_metni


def cv_analiz_et_json(cv_metni: str, hedef_rol: str = None, test_modu: bool = False):
    if test_modu:
        logger.info("TEST MODU: AI'a gidilmedi, test verisi donduruluyor")
        return {
            "puan_karnesi": {
                "genel_puan": 63,
                "ats_uyumu": 58,
                "teknik_beceri": 68,
                "etki_odaklilik": 45,
            },
            "ozet_degerlendirme": "[TEST MODU] CV genel olarak orta seviyede. Teknik beceriler listelenmis ancak projelerdeki etki ve sonuclar yeterince vurgulanmamis. CV'nin yapisi duzenli fakat icerik derinligi eksik. Adayin potansiyeli var ancak CV'si bunu tam olarak yansitamiyor. Ozellikle basari metrikleri ve somut ciktilarla guclendirilmeli.",
            "hedef_role_uygunluk": f"Aday '{hedef_rol or 'Genel'}' rolu icin orta duzeyde hazirlikli gorunuyor.",
            "guclu_yonler": [
                "Teknik beceriler Python, React, FastAPI gibi modern teknolojiler iceriyor",
                "Egitim gecmisi ve sektor bilgisi saglam",
            ],
            "eksikler_ve_cozumler": [
                {
                    "eksik": "Projelerde sadece teknoloji isimleri sayilmis, kullaniciya saglanan deger ve nicel sonuclar yok.",
                    "cozum": "Her proje icin 'Ne yapildi, nasil yapildi, hangi sorunu cozdu?' formatinda 3-4 cumle yaz.",
                },
                {
                    "eksik": "Iletisim bilgilerinde GitHub linki eksik, portfolyo paylasilmamis.",
                    "cozum": "GitHub ve LinkedIn linklerini ekle, projelerin public repo'larina baglanti ver.",
                },
            ],
            "duzeltme_onerileri": {
                "eklenmeli": [
                    "Projelere STAR formatinda aciklama (Durum, Gorev, Eylem, Sonuc)",
                    "Her proje icin sayisal metrik (kullanici sayisi, sure iyilestirmesi, vs.)",
                    "GitHub ve LinkedIn profili linki",
                ],
                "cikarilmali": [
                    "Hobiler ve ilgi alanlari kismi (CV'ye deger katmiyor)",
                ],
                "guncellenmeli": [
                    "Kisisel ozet 1 cumleden 3-4 cumleye cikarilmali",
                    "Tarih formatlari standart hale getirilmeli (yil-ay)",
                ],
            },
        }

    if not cv_metni or len(cv_metni.strip()) < 50:
        return {
            "hata": "Yuklediginiz dosya bos veya bir CV okunamadi! Lutfen en az 50 karakter iceren gecerli bir CV yukleyin."
        }

    logger.info("AI CV'yi inceliyor... (Hedef Rol: %s)", hedef_rol or "Genel Degerlendirme")

    cv_metni = _truncate_cv(cv_metni)
    prompt = _build_prompt(hedef_rol)

    if AI_PROVIDER == "gemini" and not genai_client:
        return {"hata": "Gemini API anahtari .env dosyasinda bulunamadi. Lutfen GEMINI_API_KEY ekleyin."}
    if AI_PROVIDER != "gemini" and not groq_client:
        return {"hata": "Groq API anahtari .env dosyasinda bulunamadi. Lutfen GROQ_API_KEY ekleyin."}

    try:
        if AI_PROVIDER == "gemini":
            return _analyze_with_gemini(prompt, cv_metni)
        else:
            return _analyze_with_groq(prompt, cv_metni)
    except Exception as e:
        return {"hata": f"AI analizi sirasinda bir hata olustu: {str(e)}"}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    sonuc = cv_analiz_et_json("Rastgele metin", hedef_rol="Siber Guvenlik", test_modu=True)
    print(json.dumps(sonuc, indent=4, ensure_ascii=False))
