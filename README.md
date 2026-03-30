# Parallel You - Groq + Random Forest Hackathon Stack

Parallel You is a full-stack AI + ML web app built for fast hackathon delivery. Users enter behavioral signals, get a real Random Forest prediction, then receive Groq-generated future simulations and action plans on top of that model output.

## Stack

- Frontend: React + Vite + Tailwind CSS + Framer Motion
- Backend: Node.js + Express
- Database: MongoDB Atlas free tier + Mongoose
- Auth: JWT
- ML API: Python + Flask + Scikit-learn RandomForestClassifier
- AI Text: Groq

## Features

- JWT signup/login with profile data
- Behavior scan form with study, sleep, exercise, screen time, consistency, procrastination, and goal clarity
- Synthetic ML dataset generation with 900 rows
- Trained RandomForestClassifier saved as `ml-model/model.pkl`
- Flask prediction endpoint at `/predict`
- Node API endpoint at `/api/analysis/analyze-user`
- Groq-generated strengths, weaknesses, future stories, and future-self message
- Side-by-side future simulation
- Game-style dashboard with XP, streaks, and quests
- Daily quests with difficulty-based XP multipliers
- Simple probability visualization chart
- Optional guild system

## Project Structure

```text
parallel-you/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
  ml-model/
    app.py
    train_model.py
    requirements.txt
    model.pkl
  frontend/
    src/
      api/
      components/
      context/
      data/
      layouts/
      pages/
      styles/
```

## Setup

1. Install Node dependencies:

```bash
npm install
```

2. Install Python dependencies:

```bash
python -m pip install -r ml-model/requirements.txt
```

3. Train the machine learning model:

```bash
python ml-model/train_model.py
```

4. Create environment files:

- Copy [`backend/.env.example`](/c:/Users/pushk/OneDrive/Desktop/hackanovate/backend/.env.example) to `backend/.env`
- Copy [`frontend/.env.example`](/c:/Users/pushk/OneDrive/Desktop/hackanovate/frontend/.env.example) to `frontend/.env`

5. Create a free MongoDB Atlas cluster and copy its connection string into `backend/.env`.

6. Create a Groq API key and set it in `backend/.env`.

7. Run everything:

```bash
npm run dev
```

Or run a full local readiness check first:

```bash
npm run smoke:local
```

If you want the readiness check to run before startup:

```bash
npm run dev:checked
```

- ML API: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Environment Variables

### Backend

```env
PORT=5000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=replace-with-a-strong-secret
CLIENT_URL=http://localhost:5173
ML_API_URL=http://127.0.0.1:8000
GROQ_API_KEY=your-groq-api-key
GROQ_API_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b
GROQ_FALLBACK_MODEL=llama-3.1-8b-instant
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

## ML Notes

- The model is trained on a synthetic behavioral dataset generated in `ml-model/train_model.py`.
- Features:
  - `study_hours`
  - `sleep_hours`
  - `exercise`
  - `screen_time`
  - `consistency`
  - `procrastination`
  - `goal_clarity`
- Target classes:
  - `High`
  - `Average`
  - `Negative`

## Groq Notes

- The Random Forest output is treated as the ground-truth classifier result.
- Groq is used after prediction to generate:
  - strengths and weaknesses
  - future story
  - alternate story
  - future-self message
  - daily tasks
- Recommended hackathon model on Groq:
  - `openai/gpt-oss-20b`
- Fast fallback:
  - `llama-3.1-8b-instant`
- Runtime behavior:
  - the backend tries `GROQ_MODEL` first
  - if that fails, it retries automatically with `GROQ_FALLBACK_MODEL`

## Setup References

- Groq model list: https://console.groq.com/docs/models
- Groq OpenAI-compatible API: https://console.groq.com/docs/openai
- MongoDB Atlas free tier: https://www.mongodb.com/cloud/atlas/register

## Local Smoke Test

The smoke test script checks:

- `backend/.env` and `frontend/.env`
- MongoDB connection
- Flask ML API `/health`
- Flask ML API `/predict`
- Groq API reachability
- configured Groq model availability
- configured Groq fallback model availability
- Groq text generation
- optional backend/frontend app health if already running

## Production Notes

- Add rate limiting before public deployment.
- Add email verification and password reset for production auth.
- Replace the synthetic dataset with real historical user data if you want a production-grade predictor.
