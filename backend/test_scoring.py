import pytest

from scoring import calculate_overall_score


def test_calculate_overall_score_within_range():
    scores = {
        "teknik_beceriler": 80,
        "deneyim": 70,
        "egitim": 90,
        "format_sunum": 60,
        "soft_skills": 75,
    }
    result = calculate_overall_score(scores)
    assert 0 <= result <= 100


def test_calculate_overall_score_missing_category_raises():
    with pytest.raises(ValueError):
        calculate_overall_score({"teknik_beceriler": 80})
