import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import GlassCard from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  studyHours: 4,
  sleepHours: 7,
  exercise: true,
  screenTime: 4,
  consistency: 6,
  procrastination: 4,
  goalClarity: 7
};

const QuizPage = () => {
  const navigate = useNavigate();
  const { token, setUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitQuiz = async () => {
    setSubmitting(true);
    setError("");

    try {
      await api.analyzeUser(token, form);
      const dashboard = await api.getDashboard(token);
      setUser(dashboard.user);
      navigate("/app/future");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-parallel-grid px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <GlassCard className="mb-6">
          <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">Behavior Scan</p>
          <h1 className="mt-3 text-4xl font-semibold">Feed the model your real behavioral signals.</h1>
          <p className="mt-4 max-w-3xl text-slate-300">This form powers the Random Forest classifier. No rule-based shortcuts, just the trained ML model plus AI-generated simulation on top.</p>
        </GlassCard>

        <div className="grid gap-5 md:grid-cols-2">
          {[
            { label: "Study Hours", key: "studyHours", type: "number", hint: "Hours spent learning each day", min: 0, max: 12, step: 0.5 },
            { label: "Sleep Hours", key: "sleepHours", type: "number", hint: "Average sleep per night", min: 0, max: 12, step: 0.5 },
            { label: "Screen Time", key: "screenTime", type: "number", hint: "Hours of screen exposure", min: 0, max: 12, step: 0.5 },
            { label: "Consistency Score", key: "consistency", type: "range", hint: "How consistently you follow routines", min: 1, max: 10, step: 1 },
            { label: "Procrastination", key: "procrastination", type: "range", hint: "How often you delay important work", min: 1, max: 10, step: 1 },
            { label: "Goal Clarity", key: "goalClarity", type: "range", hint: "How clear your long-term goals feel", min: 1, max: 10, step: 1 }
          ].map((field) => (
            <GlassCard key={field.key}>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{field.label}</p>
              <p className="mt-2 text-sm text-slate-400">{field.hint}</p>
              <input
                className="input-field mt-5"
                type={field.type}
                min={field.min}
                max={field.max}
                step={field.step}
                value={form[field.key]}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
              />
              <p className="mt-3 text-cyan-200">{form[field.key]}</p>
            </GlassCard>
          ))}

          <GlassCard>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Exercise</p>
            <p className="mt-2 text-sm text-slate-400">Do you exercise consistently during the week?</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[true, false].map((option) => (
                <button
                  key={String(option)}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, exercise: option }))}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    form.exercise === option
                      ? "border-cyan-300 bg-cyan-300/10 text-cyan-100"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {option ? "Yes, I train" : "No, not really"}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {error ? <p className="mx-auto mt-4 max-w-5xl text-rose-300">{error}</p> : null}

        <div className="mx-auto mt-8 max-w-5xl">
          <button
            type="button"
            disabled={submitting}
            onClick={submitQuiz}
            className="w-full rounded-2xl bg-cyan-400 px-6 py-4 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Running prediction model..." : "Analyze My Future"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default QuizPage;
