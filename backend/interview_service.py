import ai_client

VARSAYILAN_SORU_SAYISI = 8
GECERLI_ZORLUKLAR = {"Kolay", "Orta", "Zor"}


def _soru_uretim_prompt(pozisyon, zorluk, hedef_rol=None, egitim=None, deneyim=None, soru_sayisi=VARSAYILAN_SORU_SAYISI):
    profil_talimati = ""
    if egitim:
        profil_talimati += f"Kullanici egitim duzeyi: '{egitim}'. "
    if deneyim:
        profil_talimati += f"Kullanici deneyim seviyesi: '{deneyim}'. "
    if profil_talimati:
        profil_talimati = f"Kullanici profili: {profil_talimati}Sorulari bu seviyeye uygun sor.\n"

    return f"""
Sen deneyimli bir teknik mulakatcisin. '{pozisyon}' pozisyonu icin bir is mulakati simulasyonu hazirliyorsun.
Zorluk seviyesi: '{zorluk}'. {profil_talimati}
{f"Hedef rol/uzmanlik alani: '{hedef_rol}'." if hedef_rol else ""}

SADECE gecerli JSON dondur, baska hicbir sey yazma. Sorular TURKCE, dogal ve gercek bir mulakatta sorulacak sekilde olmali.

Kurallar:
- Tam olarak {soru_sayisi} soru uret.
- Ilk soru her zaman genel bir tanisma/kendini tanitma sorusu olmali.
- Sorular su kategorilerin karisimindan olusmali: kendini tanitma, davranissal (behavioral, STAR yontemiyle cevaplanabilir), teknik bilgi, pozisyona ozgu senaryo/problem cozme, kariyer hedefleri.
- 'Kolay' seviyede sorular temel kavramlara ve genel deneyime odaklanmali.
- 'Orta' seviyede sorular pratik senaryolara ve orta duzey teknik derinlige sahip olmali.
- 'Zor' seviyede sorular ileri duzey teknik derinlik, sistem tasarimi/mimari kararlar ve baski altinda karar verme icermeli.
- Sorular birbirini tekrar etmemeli, pozisyona ozgu ve somut olmali (genel gecer kaliplardan kacinmali).

Semasi:
{{
    "sorular": ["soru metni 1", "soru metni 2", "..."]
}}
"""


def mulakat_sorulari_uret(
    pozisyon: str,
    zorluk: str,
    hedef_rol: str = None,
    egitim: str = None,
    deneyim: str = None,
    soru_sayisi: int = VARSAYILAN_SORU_SAYISI,
    test_modu: bool = False,
) -> dict:
    if not pozisyon or not pozisyon.strip():
        return {"hata": "Pozisyon belirtilmeli."}

    if test_modu:
        print("[TEST MODU AKTIF] Mulakat sorulari icin AI'a gidilmedi, test verisi donduruluyor...")
        return {
            "sorular": [
                "Kendinizi kisaca tanitir misiniz?",
                f"{pozisyon} pozisyonuna neden basvurdunuz, sizi motive eden nedir?",
                "Zorlu bir problemi cozdugunuz bir projeden bahseder misiniz?",
                "Bir takim arkadasinizla anlasmazlik yasadiginiz bir durumu nasil yonettiniz?",
                f"{pozisyon} icin gerekli gordugunuz en onemli 3 teknik beceri nedir ve neden?",
                "Baski altinda (deadline yakinken) nasil calisirsiniz, bir ornek verir misiniz?",
                "Son 1 yilda ogrendiginiz ve sizi en cok gelistiren sey ne oldu?",
                "5 yil sonra kariyerinizi nerede goruyorsunuz?",
            ][: min(soru_sayisi, 8)],
        }

    prompt = _soru_uretim_prompt(pozisyon, zorluk, hedef_rol, egitim, deneyim, soru_sayisi)

    try:
        sonuc = ai_client.generate_json(
            system_prompt=prompt,
            user_text=f"'{pozisyon}' pozisyonu icin '{zorluk}' zorlukta {soru_sayisi} mulakat sorusu uret.",
        )
        if "sorular" not in sonuc or not isinstance(sonuc["sorular"], list) or not sonuc["sorular"]:
            return {"hata": "AI gecerli soru listesi uretemedi, lutfen tekrar deneyin."}
        return sonuc
    except Exception as e:
        return {"hata": f"Mulakat sorulari uretilirken bir hata olustu: {str(e)}"}


def _cevap_degerlendirme_prompt(pozisyon, zorluk, soru, ses_var_mi):
    transkript_talimati = (
        "Once verilen ses kaydini dinleyip birebir Turkce metne don (transcript alani). "
        "Sonra bu transkripti cevap olarak degerlendir."
        if ses_var_mi
        else "Verilen metni cevap olarak degerlendir."
    )

    return f"""
Sen deneyimli bir teknik mulakatci ve kariyer kocusun. '{pozisyon}' pozisyonu icin '{zorluk}' zorlukta yapilan
bir mulakatta adaya soruldu: "{soru}"

{transkript_talimati}

SADECE gecerli JSON dondur, baska hicbir sey yazma. Tum cikti TURKCE olmali.

Degerlendirme kurallari:
- Puanlamada adil ama gercekci ol: bos/alakasiz cevap 0-15, zayif 16-40, gelistirilebilir 41-65, iyi 66-85, mukemmel 86-100.
- Cevabin icerigine (somut ornek var mi, soruya cevap veriyor mu, yapisi duzenli mi - ozellikle STAR formatina uygunluk) odaklan.
- Ses kaydindan geliyorsa konusma akiciligini da (dolgu kelimeler, tekrarlar, tereddut) hafifce puanlamaya yansit ama asil agirlik icerikte olsun.
- Eger cevap bos, anlasilmaz veya soruyla alakasizsa bunu acikca belirt, uydurma bir icerik degerlendirmesi yapma.
- ornek_daha_iyi_cevap kisa (3-5 cumle) ve bu adayin durumuna gore gerceklikten kopuk olmayan bir ornek olmali.

Semasi:
{{
    {'"transcript": "ses kaydinin birebir metne donusturulmus hali",' if ses_var_mi else ''}
    "puan": (0-100),
    "geri_bildirim": "2-3 cumle, cevabin genel degerlendirmesi",
    "guclu_nokta": "cevaptaki somut bir guclu yon (yoksa 'Belirgin bir guclu yon tespit edilemedi')",
    "gelistirme_onerisi": "cevabi iyilestirmek icin somut, uygulanabilir 1 oneri",
    "ornek_daha_iyi_cevap": "ayni soruya verilebilecek daha guclu bir ornek cevap"
}}
"""


def cevap_degerlendir(
    soru: str,
    pozisyon: str,
    zorluk: str,
    cevap_metni: str = None,
    audio_bytes: bytes = None,
    audio_mime: str = None,
    test_modu: bool = False,
) -> dict:
    if not audio_bytes and (not cevap_metni or not cevap_metni.strip()):
        return {"hata": "Cevap bos: metin veya ses kaydi gonderilmeli."}

    if test_modu:
        print("[TEST MODU AKTIF] Cevap degerlendirmesi icin AI'a gidilmedi, test verisi donduruluyor...")
        sonuc = {
            "puan": 68,
            "geri_bildirim": "[TEST MODU] Cevap soruyla ilgili ve genel olarak anlasilir, ancak somut bir ornek veya sonuc ile desteklenmemis.",
            "guclu_nokta": "Cevap soruya dogrudan odaklanmis ve akici.",
            "gelistirme_onerisi": "STAR yontemiyle (Durum, Gorev, Eylem, Sonuc) somut bir ornek eklenmeli.",
            "ornek_daha_iyi_cevap": "[TEST MODU] Ornek: 'X projesinde Y sorunuyla karsilastim, Z adimini attim ve sonucta %N iyilesme sagladim.'",
        }
        if audio_bytes:
            sonuc["transcript"] = "[TEST MODU] Ses kaydinin test transkripti."
        return sonuc

    prompt = _cevap_degerlendirme_prompt(pozisyon, zorluk, soru, ses_var_mi=bool(audio_bytes))
    user_text = (
        "Ekteki ses kaydini dinle ve degerlendir."
        if audio_bytes
        else f"Adayin cevabi:\n\n{cevap_metni}"
    )

    try:
        sonuc = ai_client.generate_json(
            system_prompt=prompt,
            user_text=user_text,
            audio_bytes=audio_bytes,
            audio_mime=audio_mime,
        )
        if not audio_bytes:
            sonuc.setdefault("transcript", cevap_metni)
        return sonuc
    except Exception as e:
        return {"hata": f"Cevap degerlendirilirken bir hata olustu: {str(e)}"}


def _rapor_prompt(pozisyon, zorluk):
    return f"""
Sen deneyimli bir teknik mulakatci ve kariyer kocusun. '{pozisyon}' pozisyonu icin '{zorluk}' zorlukta yapilan
bir mulakat simulasyonu tamamlandi. Sana her sorunun metni, adayin cevabinin degerlendirmesi (puan ve geri bildirim)
JSON listesi olarak verilecek. Bu bilgilere dayanarak GENEL bir mulakat performans raporu hazirla.

SADECE gecerli JSON dondur, baska hicbir sey yazma. Tum cikti TURKCE olmali.

Kurallar:
- genel_puan, tum sorularin puanlarinin agirlikli/mantikli bir ozeti olmali (basit ortalama olabilir ama tutarli olsun).
- iletisim_becerisi ve teknik_yeterlilik ayri ayri degerlendirilmeli, sadece genel puanin kopyasi olmamali.
- guclu_yonler ve gelistirilmesi_gerekenler, verilen soru-cevap degerlendirmelerinden somut ornekler icermeli, genel gecer laf kalabaligi olmamali.
- genel_tavsiye, adayin bir sonraki gercek mulakata girmeden once yapmasi gereken 2-3 somut adimi icermeli.

Semasi:
{{
    "puan_karnesi": {{
        "genel_puan": (0-100),
        "iletisim_becerisi": (0-100),
        "teknik_yeterlilik": (0-100),
        "ozguven_ve_akicilik": (0-100)
    }},
    "genel_degerlendirme": "4-5 cumle, mulakatin genel ozeti",
    "guclu_yonler": ["mulakat boyunca gozlenen somut guclu yon"],
    "gelistirilmesi_gerekenler": ["mulakat boyunca gozlenen somut gelistirme alani"],
    "soru_bazli_ozet": [
        {{"soru": "...", "puan": (0-100), "kisa_not": "1 cumlelik ozet"}}
    ],
    "genel_tavsiye": "adayin bir sonraki mulakata hazirlik icin yapmasi gereken somut adimlar"
}}
"""


def mulakat_raporu_olustur(
    pozisyon: str,
    zorluk: str,
    soru_cevap_degerlendirmeleri: list,
    test_modu: bool = False,
) -> dict:
    if not soru_cevap_degerlendirmeleri:
        return {"hata": "Rapor olusturmak icin en az bir cevaplanmis soru gerekli."}

    if test_modu:
        print("[TEST MODU AKTIF] Mulakat raporu icin AI'a gidilmedi, test verisi donduruluyor...")
        return {
            "puan_karnesi": {
                "genel_puan": 66,
                "iletisim_becerisi": 70,
                "teknik_yeterlilik": 60,
                "ozguven_ve_akicilik": 68,
            },
            "genel_degerlendirme": "[TEST MODU] Aday genel olarak soruları anlayarak cevapladı, iletişimi akıcıydı ancak teknik sorularda somut örnek ve derinlik eksikti. Davranışsal sorularda STAR formatı kısmen kullanıldı.",
            "guclu_yonler": [
                "Kendini tanıtma sorusunda net ve öz bir anlatım sundu",
                "Takım çalışması örneğinde somut bir senaryo paylaştı",
            ],
            "gelistirilmesi_gerekenler": [
                "Teknik sorularda yüzeysel kaldı, derinlemesine açıklama eksikti",
                "Bazı cevaplarda sonuç/metrik paylaşılmadı",
            ],
            "soru_bazli_ozet": [
                {"soru": s.get("soru", ""), "puan": s.get("degerlendirme", {}).get("puan", 0), "kisa_not": "[TEST MODU] özet"}
                for s in soru_cevap_degerlendirmeleri
            ],
            "genel_tavsiye": "[TEST MODU] Teknik konularda derinlemesine örneklerle pratik yapın, cevaplarınızı STAR formatında (Durum, Görev, Eylem, Sonuç) yapılandırın.",
        }

    ozet_metni = "\n\n".join(
        f"Soru {i+1}: {qa.get('soru', '')}\n"
        f"Cevap/Transkript: {qa.get('degerlendirme', {}).get('transcript', qa.get('cevap_metni', ''))}\n"
        f"Puan: {qa.get('degerlendirme', {}).get('puan', 'yok')}\n"
        f"Geri bildirim: {qa.get('degerlendirme', {}).get('geri_bildirim', '')}"
        for i, qa in enumerate(soru_cevap_degerlendirmeleri)
    )

    prompt = _rapor_prompt(pozisyon, zorluk)

    try:
        return ai_client.generate_json(
            system_prompt=prompt,
            user_text=f"Mulakat soru-cevap degerlendirmeleri:\n\n{ozet_metni}",
        )
    except Exception as e:
        return {"hata": f"Mulakat raporu olusturulurken bir hata olustu: {str(e)}"}


if __name__ == "__main__":
    import json as _json
    print("--- MOCK DATA TESTI: SORU URETIMI ---")
    sorular = mulakat_sorulari_uret(pozisyon="Backend Developer", zorluk="Orta", test_modu=True)
    print(_json.dumps(sorular, indent=4, ensure_ascii=False))

    print("\n--- MOCK DATA TESTI: CEVAP DEGERLENDIRME ---")
    degerlendirme = cevap_degerlendir(
        soru=sorular["sorular"][0],
        pozisyon="Backend Developer",
        zorluk="Orta",
        cevap_metni="Merhaba, ben 3 yildir backend gelistiricisiyim...",
        test_modu=True,
    )
    print(_json.dumps(degerlendirme, indent=4, ensure_ascii=False))
