import json
from pathlib import Path

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None


class SkillAnalyzer:
    def __init__(self):
        data_path = Path(__file__).resolve().parents[1] / "data" / "career_database.json"
        database = json.loads(data_path.read_text(encoding="utf-8"))
        self.skill_categories = database["skill_categories"]
        self.model = SentenceTransformer("all-MiniLM-L6-v2") if SentenceTransformer is not None else None

    def analyze_skills(self, answers, resume_text=""):
        answer_blob = " ".join(
            [
                str(item)
                for value in answers.values()
                for item in (value if isinstance(value, list) else [value])
            ]
        )
        full_text = f"{answer_blob} {resume_text}".strip().lower()

        category_scores = {}
        evidence = {}
        for category, skills in self.skill_categories.items():
            matched = [skill for skill in skills if skill.lower() in full_text]
            category_scores[category] = min(100, 25 + len(matched) * 15) if matched else 18
            evidence[category] = matched

        inferred_skills = sorted({skill for matched in evidence.values() for skill in matched})
        confidence = 0.74 if self.model is not None else 0.52

        return {
            "category_scores": category_scores,
            "inferred_skills": inferred_skills,
            "evidence": evidence,
            "confidence": confidence,
            "summary": self._build_summary(category_scores, inferred_skills),
        }

    def get_categories(self):
        return self.skill_categories

    def _build_summary(self, scores, inferred):
        strongest = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:2]
        strengths = ", ".join(name for name, _ in strongest)
        skills = ", ".join(inferred[:6]) if inferred else "foundational capabilities"
        return f"Strongest areas: {strengths}. Detected skill signals include {skills}."
