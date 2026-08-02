import ai_client


def _build_prompt(hedef_rol=None, egitim=None, deneyim=None):
    rol_talimati = (
        f"Hedef rol: '{hedef_rol}'. Tum analiz ve oneriler bu role gore, o rolu ariyan bir "
        f"ise alim uzmaninin LinkedIn'de arayacagi anahtar kelimeler dusunulerek yapilmali."
        if hedef_rol
        else "Hedef rol belirtilmemis. Profili genel olarak guclendirecek sekilde degerlendir."
    )

    profil_talimati = ""
    if egitim:
        profil_talimati += f"Kullanici egitim duzeyi: '{egitim}'. "
    if deneyim:
        profil_talimati += f"Kullanici deneyim seviyesi: '{deneyim}'. "
    if profil_talimati:
        profil_talimati = f"\nKullanici profili: {profil_talimati}Onerileri bu seviyeye uygun, gercekci ver.\n"

    return f"""
Sen bir LinkedIn profil optimizasyon uzmani ve kariyer kocusun. {rol_talimati}{profil_talimati}

SADECE gecerli JSON dondur, baska hicbir sey yazma. Tum cikti TURKCE, dogal ve profesyonel bir dille olmali.

Kurallar:
- Baslik (headline) onerileri 220 karakteri gecmemeli, LinkedIn arama sonuclarinda one cikacak, somut anahtar kelime icermeli.
- "Hakkinda" (About) onerisi 3-5 paragraf, ilk cumle dikkat cekici olmali (ilk 2 satir mobilde kesilmeden once okuyucuyu yakalamali).
- Anahtar kelime onerileri, hedef rol icin ise alim uzmanlarinin LinkedIn aramasinda kullandigi gercek terimler olmali (teknoloji, arac, sertifika, sektor terimi).
- Guclu yonler ve gelistirme alanlari, kullanicinin verdigi gercek bilgilere dayanmali, uydurma bilgi ekleme.
- Eger kullanici bir alani bos birakmissa (ornegin "hakkinda" yoksa), bunu bir gelistirme alani olarak belirt ve o alan icin sifirdan somut bir taslak oner.

Semasi:
{{
    "puan_karnesi": {{
        "genel_puan": (0-100),
        "profil_tamligi": (0-100, doldurulmus alan sayisi ve derinligi),
        "anahtar_kelime_uyumu": (0-100, hedef role gore aranabilirlik),
        "sunum_kalitesi": (0-100, dil, akicilik, profesyonellik)
    }},
    "ozet_degerlendirme": "4-5 cumle, profilin genel durumu",
    "guclu_yonler": ["profildeki somut bir guclu yon"],
    "gelistirme_alanlari": ["profildeki somut bir eksik/zayif nokta"],
    "onerilen_basliklar": ["alternatif headline 1", "alternatif headline 2", "alternatif headline 3"],
    "onerilen_hakkimda": "yeniden yazilmis, hazir kullanilabilir About metni",
    "anahtar_kelime_onerileri": ["eklenmesi onerilen anahtar kelime/terim"],
    "bolum_onerileri": {{
        "deneyim": ["deneyim bolumu icin somut iyilestirme"],
        "beceriler": ["eklenmesi/vurgulanmasi gereken beceri"],
        "one_cikanlar": ["ekstra proje, sertifika veya vitrin (featured) onerisi"]
    }}
}}
"""


def _kullanici_profilini_metne_cevir(headline, about, experience, skills, cv_metni):
    parcalar = []
    parcalar.append(f"Mevcut Baslik (Headline): {headline.strip() if headline else '(bos - girilmemis)'}")
    parcalar.append(f"Mevcut Hakkinda (About): {about.strip() if about else '(bos - girilmemis)'}")

    if experience:
        deneyim_metni = "\n".join(f"- {e}" for e in experience if e and e.strip())
        parcalar.append(f"Deneyim Kayitlari:\n{deneyim_metni if deneyim_metni else '(bos)'}")
    else:
        parcalar.append("Deneyim Kayitlari: (bos - girilmemis)")

    if skills:
        parcalar.append(f"Beceriler: {', '.join(s.strip() for s in skills if s and s.strip())}")
    else:
        parcalar.append("Beceriler: (bos - girilmemis)")

    if cv_metni and cv_metni.strip():
        parcalar.append(f"\nEk baglam - kullanicinin CV metni (LinkedIn'de eksik alanlari doldurmak icin referans al):\n{cv_metni.strip()[:6000]}")

    return "\n\n".join(parcalar)


def linkedin_analiz_et_json(
    headline: str = None,
    about: str = None,
    experience: list = None,
    skills: list = None,
    hedef_rol: str = None,
    egitim: str = None,
    deneyim: str = None,
    cv_metni: str = None,
    test_modu: bool = False,
) -> dict:
    if not any([headline, about, experience, skills, cv_metni]):
        return {
            "hata": "LinkedIn analizi icin en az bir alan doldurulmali (baslik, hakkinda, deneyim, beceriler veya CV metni)."
        }

    if test_modu:
        print("[TEST MODU AKTIF] LinkedIn analizi icin AI'a gidilmedi, test verisi donduruluyor...")
        return {
            "puan_karnesi": {
                "genel_puan": 61,
                "profil_tamligi": 55,
                "anahtar_kelime_uyumu": 50,
                "sunum_kalitesi": 70,
            },
            "ozet_degerlendirme": "[TEST MODU] Profil temel bilgileri iceriyor ancak baslik genel ve 'Hakkinda' bolumu somut basarilardan yoksun. Hedef role yonelik anahtar kelime kullanimi zayif, bu da aranabilirligi dusuruyor.",
            "guclu_yonler": [
                "Deneyim bolumunde teknoloji isimleri dogru sekilde belirtilmis",
            ],
            "gelistirme_alanlari": [
                "'Hakkinda' bolumu bos veya cok kisa, kisisel marka hikayesi eksik",
                "Baslik sadece unvan iceriyor, deger onerisi yok",
            ],
            "onerilen_basliklar": [
                f"{hedef_rol or 'Yazilim Gelistirici'} | Modern Web Teknolojileri | Sonuc Odakli Gelistirme",
                f"Yeni Mezun {hedef_rol or 'Yazilim Gelistirici'} — Ogrenmeye Acik, Takim Calismasina Yatkin",
                f"{hedef_rol or 'Yazilim Gelistirici'} Adayi | Portfolyo: github.com/kullanici-adi",
            ],
            "onerilen_hakkimda": "[TEST MODU] Ornek About taslagi: Yazilim gelistirmeye olan tutkumu universite yillarimda basladim ve o zamandan beri ... (test modunda kisaltilmis ornek metin).",
            "anahtar_kelime_onerileri": ["Python", "React", "REST API", "Git", "Takim calismasi"],
            "bolum_onerileri": {
                "deneyim": ["Her pozisyon icin en az bir olculebilir sonuc (%, sayi, sure) ekle"],
                "beceriler": ["En cok kullanilan 5 teknik beceriyi profilin en ustune sabitle (pin)"],
                "one_cikanlar": ["GitHub projelerinden birini 'Featured' bolumune ekle"],
            },
        }

    kullanici_metni = _kullanici_profilini_metne_cevir(headline, about, experience, skills, cv_metni)
    prompt = _build_prompt(hedef_rol, egitim, deneyim)

    try:
        return ai_client.generate_json(
            system_prompt=prompt,
            user_text=f"Asagidaki LinkedIn profil bilgilerini analiz et ve JSON olarak dondur:\n\n{kullanici_metni}",
        )
    except Exception as e:
        return {"hata": f"LinkedIn analizi sirasinda bir hata olustu: {str(e)}"}


if __name__ == "__main__":
    import json as _json
    print("--- MOCK DATA TESTI ---")
    sonuc = linkedin_analiz_et_json(
        headline="Software Engineer",
        about="",
        experience=["Staj - ABC Yazilim: Backend gelistirme yaptim"],
        skills=["Python", "SQL"],
        hedef_rol="Backend Developer",
        test_modu=True,
    )
    print(_json.dumps(sonuc, indent=4, ensure_ascii=False))
