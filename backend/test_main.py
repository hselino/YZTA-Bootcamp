from dotenv import load_dotenv

load_dotenv()

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_cv_empty_text_returns_400():
    response = client.post("/analyze-cv", json={"cv_text": ""})
    assert response.status_code == 400


def test_analyze_cv_missing_field_returns_422():
    response = client.post("/analyze-cv", json={})
    assert response.status_code == 422


def test_analyze_cv_valid_returns_200():
    response = client.post(
        "/analyze-cv",
        json={
            "cv_text": "Test Kullanıcı. Python, SQL biliyor. 1 yıl deneyim.",
            "target_role": "Data Analyst",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["overall_score"] <= 100
    assert len(data["strengths"]) > 0
    assert len(data["weaknesses"]) > 0


def test_career_suggestion_missing_data_returns_400():
    response = client.post(
        "/career-suggestion",
        json={
            "strengths": [],
            "weaknesses": [],
            "category_scores": {},
            "target_role": None,
        },
    )
    assert response.status_code == 400


def test_career_suggestion_valid_returns_200():
    response = client.post(
        "/career-suggestion",
        json={
            "strengths": ["Python bilgisi"],
            "weaknesses": ["Deneyim eksikliği"],
            "category_scores": {
                "teknik_beceriler": 70,
                "deneyim": 40,
                "egitim": 80,
                "format_sunum": 60,
                "soft_skills": 50,
            },
            "target_role": "Data Analyst",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]
    assert len(data["next_steps"]) > 0
