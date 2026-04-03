import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import Dashboard from "./components/Dashboard";
import Quiz from "./components/Quiz";
import Recommendations from "./components/Recommendations";
import Roadmap from "./components/Roadmap";

const API_BASE = "http://localhost:5000/api";

const initialBaseline = {
  education: "",
  experience: "",
  technical: "",
  communication: ""
};

export default function App() {
  const [userId, setUserId] = useState(() => `demo-${Math.random().toString(36).slice(2, 10)}`);
  const [baselineAnswers, setBaselineAnswers] = useState(initialBaseline);
  const [resumeText, setResumeText] = useState("");
  const [shortTermGoal, setShortTermGoal] = useState("");
  const [longTermGoal, setLongTermGoal] = useState("");
  const [profile, setProfile] = useState({});
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationAnswers, setEvaluationAnswers] = useState({});
  const [loadingState, setLoadingState] = useState({
    baseline: false,
    goals: false,
    insights: false,
    recommendations: false,
    evaluation: false,
    roadmap: false
  });
  const [toast, setToast] = useState("");
  const roadmapRef = useRef(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const progressItems = useMemo(
    () => [
      { label: "Baseline", done: Boolean(profile.skills) },
      { label: "Goals", done: Boolean(profile.goals) },
      { label: "Insights", done: Boolean(gapAnalysis) },
      { label: "Suggestions", done: Boolean(recommendations) },
      { label: "Evaluation", done: Boolean(evaluation) },
      { label: "Skill Plan", done: Boolean(roadmap) }
    ],
    [profile, gapAnalysis, recommendations, evaluation, roadmap]
  );

  const setLoading = (key, value) =>
    setLoadingState((current) => ({
      ...current,
      [key]: value
    }));

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  };

  const hydrateProfile = async () => {
    const data = await apiRequest(`/profile/${userId}`);
    setProfile(data.profile || {});
  };

  const handleBaselineSubmit = async () => {
    try {
      setLoading("baseline", true);
      const data = await apiRequest("/assessment/baseline", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          answers: baselineAnswers,
          resume_text: resumeText
        })
      });
      setUserId(data.user_id);
      await hydrateProfile();
      setToast("Baseline assessment completed.");
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading("baseline", false);
    }
  };

  const handleGoalsSubmit = async () => {
    try {
      setLoading("goals", true);
      await apiRequest("/assessment/goals", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          short_term_goal: shortTermGoal,
          long_term_goal: longTermGoal
        })
      });
      await hydrateProfile();
      setToast("Goals interpreted successfully.");
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading("goals", false);
    }
  };

  const handleInsights = async () => {
    try {
      setLoading("insights", true);
      const data = await apiRequest("/insights/gap-analysis", {
        method: "POST",
        body: JSON.stringify({ user_id: userId })
      });
      setGapAnalysis(data);
      setToast("Skill gap analysis updated.");
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading("insights", false);
    }
  };

  const handleRecommendations = async () => {
    try {
      setLoading("recommendations", true);
      const data = await apiRequest("/suggestions/recommendations", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          skill_gaps: gapAnalysis?.skill_gaps || {}
        })
      });
      setRecommendations(data.recommendations);
      await hydrateProfile();
      setToast("Recommendations generated.");
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading("recommendations", false);
    }
  };

  const handleEvaluation = async () => {
    try {
      setLoading("evaluation", true);
      const data = await apiRequest("/evaluation/quiz", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          type: "career",
          answers: evaluationAnswers
        })
      });
      setEvaluation(data.evaluation);
      await hydrateProfile();
      setToast("Evaluation scored.");
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading("evaluation", false);
    }
  };

  const handleRoadmap = async () => {
    try {
      setLoading("roadmap", true);
      const data = await apiRequest("/roadmap/generate", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          recommendations: recommendations || {},
          skill_gaps: gapAnalysis?.skill_gaps || {}
        })
      });
      setRoadmap(data.roadmap);
      await hydrateProfile();
      setToast("Roadmap generated.");
    } catch (error) {
      setToast(error.message);
    } finally {
      setLoading("roadmap", false);
    }
  };

  const downloadRoadmap = () => {
    if (!roadmap) {
      setToast("Generate a roadmap first.");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("BUISES Skill Roadmap", 14, 20);
    doc.setFontSize(11);
    doc.text(`North star: ${roadmap.north_star}`, 14, 32);
    let y = 46;
    roadmap.weekly_milestones.forEach((milestone, index) => {
      doc.text(`${index + 1}. ${milestone.title} (${milestone.due_date})`, 14, y);
      y += 8;
      doc.text(`   ${milestone.time_commitment} • ${milestone.status}`, 14, y);
      y += 10;
    });
    doc.save("career-roadmap.pdf");
  };

  return (
    <div className="min-h-screen bg-hero-gradient px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-panel overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-700">Career Guidance System</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                BUISES-powered AI roadmap for career growth
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Assess your baseline, clarify goals, uncover skill gaps, generate personalized suggestions, evaluate progress, and build a living skill plan in one interactive experience.
              </p>
            </div>
            <div className="rounded-[28px] bg-slate-950 px-5 py-4 text-white">
              <p className="text-sm opacity-70">Momentum</p>
              <p className="mt-2 text-3xl font-semibold">
                {progressItems.filter((item) => item.done).length}/{progressItems.length}
              </p>
              <p className="mt-2 text-sm text-slate-300">badges unlocked</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-6">
            {progressItems.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${item.done ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-white/70 text-slate-500"}`}
              >
                {item.label}
              </div>
            ))}
          </div>
        </motion.header>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1.35fr]">
          <div className="space-y-6">
            <Quiz
              baselineAnswers={baselineAnswers}
              setBaselineAnswers={setBaselineAnswers}
              resumeText={resumeText}
              setResumeText={setResumeText}
              onSubmitBaseline={handleBaselineSubmit}
              submittingBaseline={loadingState.baseline}
              evaluationAnswers={evaluationAnswers}
              setEvaluationAnswers={setEvaluationAnswers}
              onSubmitEvaluation={handleEvaluation}
              evaluating={loadingState.evaluation}
            />

            <section className="glass-panel p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">Understanding Goals</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Translate ambition into action</h2>
                </div>
                <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">U</div>
              </div>

              <div className="space-y-4">
                <textarea
                  rows={4}
                  className="soft-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  placeholder="Short-term goal: get internship, improve frontend depth, switch into data..."
                  value={shortTermGoal}
                  onChange={(event) => setShortTermGoal(event.target.value)}
                />
                <textarea
                  rows={4}
                  className="soft-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  placeholder="Long-term goal: become AI PM, senior frontend engineer, ML engineer..."
                  value={longTermGoal}
                  onChange={(event) => setLongTermGoal(event.target.value)}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGoalsSubmit}
                  disabled={loadingState.goals}
                  className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {loadingState.goals ? "Interpreting goals..." : "Interpret goals"}
                </button>
                <button
                  type="button"
                  onClick={handleInsights}
                  disabled={loadingState.insights}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loadingState.insights ? "Finding gaps..." : "Run insights"}
                </button>
                <button
                  type="button"
                  onClick={handleRecommendations}
                  disabled={loadingState.recommendations || !gapAnalysis}
                  className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  {loadingState.recommendations ? "Generating..." : "Create suggestions"}
                </button>
                <button
                  type="button"
                  onClick={handleRoadmap}
                  disabled={loadingState.roadmap || !recommendations}
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {loadingState.roadmap ? "Planning..." : "Build skill plan"}
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6" ref={roadmapRef}>
            <Dashboard profile={profile} gapAnalysis={gapAnalysis} evaluation={evaluation} />
            <Recommendations recommendations={recommendations} loading={loadingState.recommendations} />
            <Roadmap roadmap={roadmap} onDownload={downloadRoadmap} />
          </div>
        </section>
      </div>

      {toast ? (
        <div className="fixed bottom-5 right-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
