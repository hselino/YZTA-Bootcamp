"""
Ortak AI istemcisi: linkedin_service.py ve interview_service.py tarafindan kullanilir.
ai_service.py (CV analizi) bilerek dokunulmadan birakildi; bu modul yeni ozellikler icin
ayni AI_PROVIDER/anahtar mantigini tekrar etmek yerine tek bir yerden yonetir.
"""
import os
import json
from dotenv import load_dotenv

load_dotenv()

AI_PROVIDER = os.getenv("AI_PROVIDER", "groq").lower()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

groq_client = None
genai_client = None

if AI_PROVIDER == "gemini":
    from google import genai as genai_sdk
    genai_client = genai_sdk.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
else:
    if GROQ_API_KEY:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)


def is_configured() -> bool:
    return bool(genai_client or groq_client)


def generate_json(system_prompt: str, user_text: str, audio_bytes: bytes = None, audio_mime: str = None) -> dict:
    """Sistem promptu + kullanici metni (ve istege bagli ses kaydi) ile modelden gecerli JSON dondurur.

    Ses girdisi (audio_bytes) su an sadece Gemini saglayicisinda destekleniyor, cunku Gemini
    sesi doogrudan (ayri bir speech-to-text servisine gerek kalmadan) anlayabiliyor.
    """
    if not is_configured():
        raise RuntimeError(
            "AI saglayicisi yapilandirilmamis: AI_PROVIDER, GEMINI_API_KEY veya GROQ_API_KEY .env icinde eksik."
        )

    if AI_PROVIDER == "gemini":
        from google.genai import types

        contents = []
        if audio_bytes:
            contents.append(types.Part.from_bytes(data=audio_bytes, mime_type=audio_mime or "audio/mp3"))
        contents.append(user_text)

        response = genai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)

    if audio_bytes:
        raise RuntimeError(
            "Ses kaydiyla cevap degerlendirmesi yalnizca AI_PROVIDER=gemini ile calisir. "
            "Groq saglayicisi ses girdisini desteklemiyor."
        )

    chat_completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        model=GROQ_MODEL,
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    return json.loads(chat_completion.choices[0].message.content)
