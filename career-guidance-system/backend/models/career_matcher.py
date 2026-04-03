import json
from datetime import datetime, timedelta
from pathlib import Path

from utils.embeddings import EmbeddingStore


class CareerMatcher:
    def __init__(self):
        data_path = Path(__file__).resolve().parents[1] / "data" / "career_database.json"
        self.database = json.loads(data_path.read_text(encoding="utf-8"))
        self.embedding_store = EmbeddingStore(str(data_path))

    def analyze_skill_gaps(self, current_skills, required_skills):
        current = {skill.lower() for skill in current_skills.get("inferred_skills", [])}
        needed = [skill.lower() for skill in required_skills]
        gaps = []
        strengths = []

        for skill in needed:
            if skill in current:
                strengths.append(skill)
            else:
                gaps.append(
                    {
                        "skill": skill,
                        "priority": "high" if len(gaps) < 3 else "medium",
                        "readiness": 30 if skill not in current else 80,
                    }
                )

        return {
            "strengths": strengths,
            "gaps": gaps,
            "coverage_percent": round((len(strengths) / max(1, len(needed))) * 100),
        }

    def get_industry_trends(self, suggested_roles):
        trends = []
        for role in suggested_roles:
            matches = self.embedding_store.semantic_search(role, top_k=1)
            if matches:
                trends.append(
                    {
                        "role": matches[0]["title"],
                        "trends": matches[0]["trends"],
                        "top_skills": matches[0]["skills"][:5],
                    }
                )
        return trends

    def calculate_match_score(self, current_skills, career_goals):
        required = {skill.lower() for skill in career_goals.get("required_skills", [])}
        current = {skill.lower() for skill in current_skills.get("inferred_skills", [])}
        if not required:
            return 48
        return round((len(required & current) / len(required)) * 100)

    def create_roadmap(self, user_profile, recommendations, skill_gaps):
        goals = user_profile.get("goals", {})
        short_steps = goals.get("short_term_breakdown", [])
        missing_skills = skill_gaps.get("gaps", [])
        action_plan = recommendations.get("action_plan", [])
        roadmap = []
        start_date = datetime.utcnow().date()

        for idx, action in enumerate(action_plan[:8], start=1):
            roadmap.append(
                {
                    "id": idx,
                    "title": action["action"],
                    "target_week": action["week"],
                    "milestone_type": "learning",
                    "due_date": (start_date + timedelta(days=(idx - 1) * 7)).isoformat(),
                    "time_commitment": action["time_commitment"],
                    "status": "up-next" if idx == 1 else "planned",
                }
            )

        for idx, gap in enumerate(missing_skills[:3], start=len(roadmap) + 1):
            roadmap.append(
                {
                    "id": idx,
                    "title": f"Close {gap['skill']} gap",
                    "target_week": idx,
                    "milestone_type": "skill-gap",
                    "due_date": (start_date + timedelta(days=(idx - 1) * 7)).isoformat(),
                    "time_commitment": "4-6 hrs",
                    "status": "planned",
                }
            )

        return {
            "headline_goal": goals.get("long_term_breakdown", ["Break into a stronger role"])[0],
            "focus_skills": [gap["skill"] for gap in missing_skills[:5]],
            "weekly_milestones": roadmap,
            "north_star": short_steps[0] if short_steps else "Build measurable momentum every week",
        }
