import hashlib
import json
import os
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from openai import OpenAI
except Exception:  # pragma: no cover
    OpenAI = None

from models.career_matcher import CareerMatcher
from models.quiz_evaluator import QuizEvaluator
from models.skill_analyzer import SkillAnalyzer
from utils.resume_parser import ResumeParser

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / os.getenv("DATABASE_PATH", "career_guidance.db")
DATA_PATH = BASE_DIR / "data" / "career_database.json"

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "career-guidance-secret-key")
CORS(app, supports_credentials=True)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if OpenAI and os.getenv("OPENAI_API_KEY") else None
skill_analyzer = SkillAnalyzer()
career_matcher = CareerMatcher()
quiz_evaluator = QuizEvaluator()
resume_parser = ResumeParser()
career_database = json.loads(DATA_PATH.read_text(encoding="utf-8"))


def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def default_gamification_state():
    return {
        "points": 340,
        "level": 18,
        "streakDays": 5,
        "lastActiveDate": datetime.utcnow().date().isoformat(),
        "badges": [
            {"id": "badge1", "name": "Python Novice", "description": "Completed first Python quiz", "unlocked": True, "icon": "fab fa-python", "color": "#306998"},
            {"id": "badge2", "name": "AI Explorer", "description": "Finished AI mini-project", "unlocked": True, "icon": "fas fa-robot", "color": "#8b5cf6"},
            {"id": "badge3", "name": "Data Analyst", "description": "Scored 90% in data quiz", "unlocked": False, "requirement": "Reach 500 points", "icon": "fas fa-chart-line", "color": "#f97316"},
            {"id": "badge4", "name": "Web Weaver", "description": "Build a portfolio component", "unlocked": False, "requirement": "7 day streak", "icon": "fas fa-code", "color": "#06b6d4"},
            {"id": "badge5", "name": "Career Guru", "description": "Finish all BUISES checkpoints", "unlocked": False, "requirement": "Reach 1000 points", "icon": "fas fa-bullhorn", "color": "#ec489a"},
        ],
        "skillNodes": [
            {"id": "python", "name": "Python", "mastery": 75, "status": "learning", "colorCode": "#eab308"},
            {"id": "ai", "name": "AI/ML", "mastery": 40, "status": "learning", "colorCode": "#eab308"},
            {"id": "data", "name": "Data Science", "mastery": 20, "status": "needs-improvement", "colorCode": "#ef4444"},
            {"id": "web", "name": "Web Dev", "mastery": 60, "status": "learning", "colorCode": "#eab308"},
            {"id": "cloud", "name": "Cloud Computing", "mastery": 10, "status": "needs-improvement", "colorCode": "#ef4444"},
            {"id": "softskills", "name": "Soft Skills", "mastery": 85, "status": "mastered", "colorCode": "#22c55e"},
        ],
    }


def recalc_level(points):
    return int(points ** 0.5)


def update_skill_mastery(points, current_skills):
    updated = []
    for skill in current_skills:
        mastery = skill["mastery"]
        if skill["id"] == "python":
            mastery = min(100, 40 + points // 12)
        elif skill["id"] == "ai":
            mastery = min(100, 20 + points // 18)
        elif skill["id"] == "data":
            mastery = min(100, 10 + points // 22)
        elif skill["id"] == "web":
            mastery = min(100, 35 + points // 14)
        elif skill["id"] == "cloud":
            mastery = min(100, 5 + points // 28)
        elif skill["id"] == "softskills":
            mastery = min(100, 65 + points // 30)

        status = "needs-improvement"
        if mastery >= 70:
            status = "mastered"
        elif mastery >= 35:
            status = "learning"

        updated.append(
            {
                **skill,
                "mastery": round(mastery),
                "status": status,
                "colorCode": "#22c55e" if status == "mastered" else "#eab308" if status == "learning" else "#ef4444",
            }
        )
    return updated


def unlock_badges(gamification, completed_milestones):
    badges = [{**badge} for badge in gamification["badges"]]
    unlocked = []

    def unlock(badge_id):
        for badge in badges:
            if badge["id"] == badge_id and not badge["unlocked"]:
                badge["unlocked"] = True
                unlocked.append(badge)

    if gamification["points"] >= 500:
        unlock("badge3")
    if gamification["points"] >= 1000 or completed_milestones >= 6:
        unlock("badge5")
    if gamification["streakDays"] >= 7:
        unlock("badge4")

    return badges, unlocked


def init_db():
    connection = get_db()
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            baseline_data TEXT DEFAULT '{}',
            goals_data TEXT DEFAULT '{}',
            recommendations_data TEXT DEFAULT '{}',
            roadmap_data TEXT DEFAULT '{}',
            resume_data TEXT DEFAULT '{}',
            gamification_data TEXT DEFAULT '{}',
            updated_at TEXT
        );

        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            quiz_type TEXT NOT NULL,
            score INTEGER NOT NULL,
            weak_areas TEXT DEFAULT '[]',
            created_at TEXT NOT NULL
        );
        """
    )

    columns = [row["name"] for row in connection.execute("PRAGMA table_info(user_profiles)").fetchall()]
    if "gamification_data" not in columns:
        connection.execute("ALTER TABLE user_profiles ADD COLUMN gamification_data TEXT DEFAULT '{}'")

    connection.commit()
    connection.close()


init_db()


def ensure_user_profile(user_id):
    now = datetime.utcnow().isoformat()
    connection = get_db()
    connection.execute(
        """
        INSERT OR IGNORE INTO user_profiles (user_id, gamification_data, updated_at)
        VALUES (?, ?, ?)
        """,
        (user_id, json.dumps(default_gamification_state()), now),
    )
    row = connection.execute("SELECT gamification_data FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
    if not row["gamification_data"] or row["gamification_data"] == "{}":
        connection.execute(
            "UPDATE user_profiles SET gamification_data = ?, updated_at = ? WHERE user_id = ?",
            (json.dumps(default_gamification_state()), now, user_id),
        )
    connection.commit()
    connection.close()


def update_profile_section(user_id, section, value):
    ensure_user_profile(user_id)
    connection = get_db()
    connection.execute(
        f"UPDATE user_profiles SET {section} = ?, updated_at = ? WHERE user_id = ?",
        (json.dumps(value), datetime.utcnow().isoformat(), user_id),
    )
    connection.commit()
    connection.close()


def load_profile(user_id):
    ensure_user_profile(user_id)
    connection = get_db()
    row = connection.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)).fetchone()
    progress_rows = connection.execute(
        "SELECT quiz_type, score, weak_areas, created_at FROM user_progress WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    connection.close()

    return {
        "user_id": row["user_id"],
        "skills": json.loads(row["baseline_data"] or "{}"),
        "goals": json.loads(row["goals_data"] or "{}"),
        "recommendations": json.loads(row["recommendations_data"] or "{}"),
        "roadmap": json.loads(row["roadmap_data"] or "{}"),
        "resume_data": json.loads(row["resume_data"] or "{}"),
        "gamification": json.loads(row["gamification_data"] or "{}") or default_gamification_state(),
        "progress": [
            {
                "quiz_type": item["quiz_type"],
                "score": item["score"],
                "weak_areas": json.loads(item["weak_areas"] or "[]"),
                "created_at": item["created_at"],
            }
            for item in progress_rows
        ],
    }


def save_gamification(user_id, gamification):
    update_profile_section(user_id, "gamification_data", gamification)


def award_points(user_id, base_points, reason, completed_milestones=None):
    profile = load_profile(user_id)
    gamification = profile["gamification"] or default_gamification_state()
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    last_active = gamification.get("lastActiveDate", today.isoformat())

    streak_days = gamification.get("streakDays", 0)
    streak_bonus = 0
    if last_active != today.isoformat():
        if last_active == yesterday.isoformat():
            streak_days += 1
        else:
            streak_days = 1
        if streak_days >= 3 and streak_days % 3 == 0:
            streak_bonus = 20
    else:
        streak_days = max(1, streak_days)

    total_points = gamification.get("points", 0) + base_points + streak_bonus
    gamification["points"] = total_points
    gamification["level"] = recalc_level(total_points)
    gamification["streakDays"] = streak_days
    gamification["lastActiveDate"] = today.isoformat()
    gamification["skillNodes"] = update_skill_mastery(total_points, gamification.get("skillNodes", default_gamification_state()["skillNodes"]))
    milestones = completed_milestones if completed_milestones is not None else len([item for item in profile.get("progress", [])])
    badges, unlocked = unlock_badges(gamification, milestones)
    gamification["badges"] = badges
    save_gamification(user_id, gamification)

    return {
        "gamification": gamification,
        "reward": {
            "reason": reason,
            "earned_points": base_points,
            "streak_bonus": streak_bonus,
            "new_badges": unlocked,
            "total_points": total_points,
        },
    }


def fallback_goal_interpretation(short_term_goal, long_term_goal):
    combined = f"{short_term_goal} {long_term_goal}".lower()
    matched_roles = career_matcher.embedding_store.semantic_search(combined, top_k=2)
    required_skills = sorted({skill for role in matched_roles for skill in role["skills"][:5]})
    return {
        "short_term_breakdown": [
            "Define a focused target role and baseline skills.",
            "Build 1 portfolio-grade project aligned to that role.",
            "Strengthen resume and networking proof points.",
        ],
        "long_term_breakdown": [
            "Reach interview-ready confidence for target opportunities.",
            "Demonstrate practical experience with industry-standard tools.",
            "Transition into a stronger role with measurable outcomes.",
        ],
        "required_skills": required_skills,
        "suggested_roles": [role["title"] for role in matched_roles],
    }


def generate_goals_analysis(short_term_goal, long_term_goal):
    if client is None:
        return fallback_goal_interpretation(short_term_goal, long_term_goal)

    prompt = f"""
Interpret these career goals and return strict JSON only.

Short-term goal: {short_term_goal}
Long-term goal: {long_term_goal}

Return:
{{
  "short_term_breakdown": ["objective"],
  "long_term_breakdown": ["milestone"],
  "required_skills": ["skill"],
  "suggested_roles": ["role"]
}}
"""
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    return json.loads(response.choices[0].message.content)


def fallback_recommendations(user_profile, skill_gaps):
    role_query = " ".join(user_profile.get("goals", {}).get("suggested_roles", []))
    matched_roles = career_matcher.embedding_store.semantic_search(role_query, top_k=2)
    role = matched_roles[0] if matched_roles else career_database["roles"][0]
    actions = [
        {"week": 1, "action": f"Study {gap['skill']} fundamentals", "time_commitment": "4 hrs"}
        for gap in skill_gaps.get("gaps", [])[:3]
    ]
    if not actions:
        actions = [{"week": 1, "action": "Deepen one strength with a real project", "time_commitment": "4 hrs"}]

    return {
        "courses": role["courses"],
        "projects": role["projects"],
        "certifications": role["certifications"],
        "action_plan": actions,
    }


def generate_recommendations(user_profile, skill_gaps):
    if client is None:
        return fallback_recommendations(user_profile, skill_gaps)

    prompt = f"""
Create practical career-skill recommendations and return strict JSON only.

Current skills: {user_profile.get("skills", {})}
Goals: {user_profile.get("goals", {})}
Skill gaps: {skill_gaps}

Return:
{{
  "courses": [{{"name": "", "platform": "", "duration": "", "priority": ""}}],
  "projects": [{{"name": "", "description": "", "estimated_time": ""}}],
  "certifications": [{{"name": "", "provider": "", "cost": ""}}],
  "action_plan": [{{"week": 1, "action": "", "time_commitment": ""}}]
}}
"""
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
    )
    return json.loads(response.choices[0].message.content)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})


@app.route("/api/assessment/baseline", methods=["POST"])
def baseline_assessment():
    data = request.json or {}
    user_id = data.get("user_id") or hashlib.md5(str(datetime.utcnow().timestamp()).encode()).hexdigest()[:12]
    answers = data.get("answers", {})
    resume_text = data.get("resume_text", "")
    skills_analysis = skill_analyzer.analyze_skills(answers, resume_text)
    update_profile_section(user_id, "baseline_data", skills_analysis)
    reward_payload = award_points(user_id, 55, "Baseline assessment completed")
    return jsonify(
        {
            "status": "success",
            "user_id": user_id,
            "skills_analysis": skills_analysis,
            "skill_categories": skill_analyzer.get_categories(),
            **reward_payload,
        }
    )


@app.route("/api/assessment/goals", methods=["POST"])
def understanding_goals():
    data = request.json or {}
    user_id = data.get("user_id", "anonymous")
    short_term_goal = data.get("short_term_goal", "")
    long_term_goal = data.get("long_term_goal", "")
    goals_analysis = generate_goals_analysis(short_term_goal, long_term_goal)
    update_profile_section(user_id, "goals_data", goals_analysis)
    reward_payload = award_points(user_id, 45, "Goals clarified")
    return jsonify({"status": "success", "goals_analysis": goals_analysis, **reward_payload})


@app.route("/api/insights/gap-analysis", methods=["POST"])
def gap_analysis():
    data = request.json or {}
    user_id = data.get("user_id", "anonymous")
    user_profile = load_profile(user_id)
    current_skills = user_profile.get("skills", {})
    career_goals = user_profile.get("goals", {})

    skill_gaps = career_matcher.analyze_skill_gaps(current_skills, career_goals.get("required_skills", []))
    industry_trends = career_matcher.get_industry_trends(career_goals.get("suggested_roles", []))
    reward_payload = award_points(user_id, 35, "Insights generated")
    return jsonify(
        {
            "status": "success",
            "skill_gaps": skill_gaps,
            "industry_trends": industry_trends,
            "match_score": career_matcher.calculate_match_score(current_skills, career_goals),
            **reward_payload,
        }
    )


@app.route("/api/suggestions/recommendations", methods=["POST"])
def get_recommendations():
    data = request.json or {}
    user_id = data.get("user_id", "anonymous")
    user_profile = load_profile(user_id)
    skill_gaps = data.get("skill_gaps", {})
    recommendations = generate_recommendations(user_profile, skill_gaps)
    update_profile_section(user_id, "recommendations_data", recommendations)
    reward_payload = award_points(user_id, 50, "Suggestions generated")
    return jsonify({"status": "success", "recommendations": recommendations, **reward_payload})


@app.route("/api/evaluation/quiz", methods=["POST"])
def evaluate_quiz():
    data = request.json or {}
    user_id = data.get("user_id", "anonymous")
    evaluation = quiz_evaluator.evaluate(data.get("answers", {}), data.get("type", "technical"))
    connection = get_db()
    connection.execute(
        """
        INSERT INTO user_progress (user_id, quiz_type, score, weak_areas, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            user_id,
            data.get("type", "technical"),
            evaluation["score"],
            json.dumps(evaluation["weak_areas"]),
            datetime.utcnow().isoformat(),
        ),
    )
    connection.commit()
    connection.close()
    bonus = 60 if evaluation["score"] >= 85 else 40 if evaluation["score"] >= 65 else 25
    reward_payload = award_points(user_id, bonus, "Evaluation completed")
    return jsonify({"status": "success", "evaluation": evaluation, **reward_payload})


@app.route("/api/roadmap/generate", methods=["POST"])
def generate_roadmap():
    data = request.json or {}
    user_id = data.get("user_id", "anonymous")
    user_profile = load_profile(user_id)
    recommendations = data.get("recommendations", user_profile.get("recommendations", {}))
    skill_gaps = data.get("skill_gaps", {})
    roadmap = career_matcher.create_roadmap(user_profile, recommendations, skill_gaps)
    update_profile_section(user_id, "roadmap_data", roadmap)
    completed_milestones = len([section for section in [user_profile.get("skills"), user_profile.get("goals"), recommendations, roadmap] if section])
    reward_payload = award_points(user_id, 65, "Skill plan generated", completed_milestones=completed_milestones + 2)
    return jsonify({"status": "success", "roadmap": roadmap, "progress_tracking": user_profile.get("progress", []), **reward_payload})


@app.route("/api/resume/upload", methods=["POST"])
def upload_resume():
    if "resume" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400
    file = request.files["resume"]
    user_id = request.form.get("user_id", "anonymous")
    resume_data = resume_parser.parse(file)
    update_profile_section(user_id, "resume_data", resume_data)
    reward_payload = award_points(user_id, 25, "Resume uploaded")
    return jsonify({"status": "success", "resume_data": resume_data, **reward_payload})


@app.route("/api/gamification/action", methods=["POST"])
def gamification_action():
    data = request.json or {}
    user_id = data.get("user_id", "anonymous")
    points = int(data.get("points", 0))
    label = data.get("label", "Gamification action")
    reward_payload = award_points(user_id, points, label)
    return jsonify({"status": "success", **reward_payload})


@app.route("/api/profile/<user_id>", methods=["GET"])
def get_profile(user_id):
    return jsonify({"status": "success", "profile": load_profile(user_id)})


@app.route("/api/sample-data", methods=["GET"])
def sample_data():
    return jsonify({"status": "success", "roles": career_database["roles"], "evaluations": career_database["evaluation_bank"]})


if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PORT", "5000")))
