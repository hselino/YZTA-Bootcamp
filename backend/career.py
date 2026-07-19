import os

from google import genai
from google.genai import types
from pydantic import BaseModel


class CareerSuggestion(BaseModel):
    summary: str
    next_steps: list[str]


PROMPT_TEMPLATE = """
Sen bir kariyer koçusun. Aşağıdaki CV analiz sonucuna göre kısa ve uygulanabilir
bir kariyer önerisi hazırla.

Hedef pozisyon: {target_role}
Güçlü yönler: {strengths}
Zayıf yönler: {weaknesses}
Kategori skorları: {category_scores}

2-3 cümlelik kısa bir özet ve en fazla 5 maddelik somut, uygulanabilir
sonraki adımlar listesi ver.
"""


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY tanımlı değil. backend/.env dosyasına gerçek bir "
            "Gemini API anahtarı ekleyin (bkz. .env.example)."
        )
    return genai.Client(api_key=api_key)


def generate_career_suggestion(
    strengths: list[str],
    weaknesses: list[str],
    category_scores: dict,
    target_role: str | None = None,
) -> CareerSuggestion:
    if not strengths and not weaknesses:
        raise ValueError(
            "Kariyer önerisi üretmek için en az bir güçlü veya zayıf yön gerekli."
        )

    client = _get_client()
    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    prompt = PROMPT_TEMPLATE.format(
        target_role=target_role or "belirtilmedi",
        strengths=", ".join(strengths) or "belirtilmedi",
        weaknesses=", ".join(weaknesses) or "belirtilmedi",
        category_scores=category_scores or "belirtilmedi",
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CareerSuggestion,
        ),
    )

    return CareerSuggestion.model_validate_json(response.text)
