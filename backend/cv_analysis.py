import os

from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from scoring import WEIGHTS, calculate_overall_score


class CategoryScores(BaseModel):
    teknik_beceriler: int = Field(ge=0, le=100)
    deneyim: int = Field(ge=0, le=100)
    egitim: int = Field(ge=0, le=100)
    format_sunum: int = Field(ge=0, le=100)
    soft_skills: int = Field(ge=0, le=100)


class CVAnalysisAIResult(BaseModel):
    category_scores: CategoryScores
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]


class CVAnalysisResult(BaseModel):
    overall_score: int
    category_scores: CategoryScores
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]


PROMPT_TEMPLATE = """
Sen deneyimli bir İK uzmanı ve kariyer koçusun. Aşağıdaki CV'yi değerlendir.

Hedef pozisyon: {target_role}

CV metni:
---
{cv_text}
---

Her kategoriyi 0-100 arasında puanla: {categories}.
Ayrıca güçlü yönler, zayıf yönler ve geliştirme önerileri listele (her biri kısa, net cümleler).
"""


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY tanımlı değil. backend/.env dosyasına gerçek bir "
            "Gemini API anahtarı ekleyin (bkz. .env.example)."
        )
    return genai.Client(api_key=api_key)


def analyze_cv(cv_text: str, target_role: str | None = None) -> CVAnalysisResult:
    if not cv_text or not cv_text.strip():
        raise ValueError("CV metni boş olamaz.")

    client = _get_client()
    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

    prompt = PROMPT_TEMPLATE.format(
        target_role=target_role or "belirtilmedi",
        cv_text=cv_text,
        categories=", ".join(WEIGHTS.keys()),
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=CVAnalysisAIResult,
        ),
    )

    ai_result = CVAnalysisAIResult.model_validate_json(response.text)
    overall_score = calculate_overall_score(ai_result.category_scores.model_dump())

    return CVAnalysisResult(
        overall_score=overall_score,
        category_scores=ai_result.category_scores,
        strengths=ai_result.strengths,
        weaknesses=ai_result.weaknesses,
        suggestions=ai_result.suggestions,
    )
