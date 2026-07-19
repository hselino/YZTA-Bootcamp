from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from career import CareerSuggestion, generate_career_suggestion
from cv_analysis import CVAnalysisResult, analyze_cv

app = FastAPI(title="AI Career Coach - CV Analysis API")


class AnalyzeCVRequest(BaseModel):
    cv_text: str
    target_role: str | None = None


class CareerSuggestionRequest(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    category_scores: dict[str, int]
    target_role: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze-cv", response_model=CVAnalysisResult)
def analyze_cv_endpoint(payload: AnalyzeCVRequest):
    try:
        return analyze_cv(payload.cv_text, payload.target_role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/career-suggestion", response_model=CareerSuggestion)
def career_suggestion_endpoint(payload: CareerSuggestionRequest):
    try:
        return generate_career_suggestion(
            payload.strengths,
            payload.weaknesses,
            payload.category_scores,
            payload.target_role,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
