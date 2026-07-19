WEIGHTS = {
    "teknik_beceriler": 0.35,
    "deneyim": 0.30,
    "egitim": 0.15,
    "format_sunum": 0.10,
    "soft_skills": 0.10,
}


def calculate_overall_score(category_scores: dict) -> int:
    missing = WEIGHTS.keys() - category_scores.keys()
    if missing:
        raise ValueError(f"Eksik kategori skorları: {missing}")

    total = sum(category_scores[k] * WEIGHTS[k] for k in WEIGHTS)
    return round(total)
