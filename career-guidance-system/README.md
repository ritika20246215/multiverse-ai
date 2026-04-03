# BUISES Career Guidance System

Hackathon-ready full-stack app for personalized career guidance using the BUISES framework:

- `B` Baseline Assessment
- `U` Understanding Goals
- `I` Insights
- `S` Suggestions
- `E` Evaluation
- `S` Skill Plan

## Folder Structure

```text
career-guidance-system/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── models/
│   │   ├── skill_analyzer.py
│   │   ├── career_matcher.py
│   │   └── quiz_evaluator.py
│   ├── utils/
│   │   ├── embeddings.py
│   │   └── resume_parser.py
│   └── data/
│       └── career_database.json
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   ├── Quiz.js
│   │   │   ├── Recommendations.js
│   │   │   ├── Roadmap.js
│   │   │   └── SkillGapChart.js
│   │   └── styles/
│   │       └── tailwind.css
└── README.md
```

## Stack

- Frontend: React + TailwindCSS + Framer Motion + Chart.js
- Backend: Flask + Flask-CORS
- AI/ML:
  - OpenAI GPT-compatible model for goal interpretation and recommendations
  - Sentence-BERT style semantic matching for baseline skill analysis
  - FAISS-backed retrieval for role/course lookup
  - DistilBERT-style evaluation fallback for short-text scoring
  - Optional resume parsing via PDF extraction
- Database: SQLite

## Local Setup

### 1. Backend

```bash
cd career-guidance-system/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

Backend runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd career-guidance-system/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## API Key Setup

In `career-guidance-system/backend/.env`:

```env
SECRET_KEY=career-guidance-secret-key
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4o-mini
DATABASE_PATH=career_guidance.db
```

If no API key is provided, the backend falls back to deterministic local heuristics so the demo still works.

## What Works

- Baseline assessment with skill-category inference
- Goal interpretation and role matching
- Gap analysis vs role expectations
- Personalized recommendations with courses, projects, certifications, and weekly actions
- Short-text evaluation with weak-area detection
- Roadmap generation and downloadable PDF
- SQLite profile/progress persistence
- Sample role, course, and evaluation data included

## Deployment Notes

- For production, serve Flask behind Gunicorn/Uvicorn + Nginx
- Replace SQLite with Postgres or Firebase if you need multi-user scale
- For heavier ML inference, move transformers / embedding models to a worker or external inference service
- Lock CORS to your frontend origin before deployment

## Demo Flow

1. Fill in the baseline assessment
2. Add short-term and long-term goals
3. Run insights to find gaps
4. Generate suggestions
5. Complete evaluation
6. Build and download the skill plan
