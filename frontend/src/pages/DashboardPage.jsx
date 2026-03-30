import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../api/client";
import GlassCard from "../components/GlassCard.jsx";
import PredictionChart from "../components/PredictionChart.jsx";
import QuestCard from "../components/QuestCard.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const DashboardPage = () => {
  const { token, setUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    const response = await api.getDashboard(token);
    setDashboard(response);
    setUser(response.user);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleGenerateQuests = async () => {
    await api.generateQuests(token);
    await loadDashboard();
  };

  const handleCompleteQuest = async (questId) => {
    await api.completeQuest(token, questId);
    await loadDashboard();
  };

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center text-slate-300">Loading command center...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="XP" value={dashboard.stats.xp} accent="from-cyan-400 to-blue-500" />
        <StatCard label="Streak" value={`${dashboard.stats.streak} days`} accent="from-fuchsia-400 to-rose-500" />
        <StatCard label="Prediction" value={dashboard.stats.prediction || "Pending"} accent="from-emerald-400 to-teal-500" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">AI + ML Insight Layer</p>
          <h2 className="mt-3 text-3xl font-semibold">{dashboard.analysis?.personalityType || "Awaiting analysis"}</h2>
          <p className="mt-4 text-slate-300">{dashboard.analysis?.summary}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-500">Strengths</p>
              <ul className="space-y-2 text-slate-300">
                {(dashboard.analysis?.strengths || []).map((item) => (
                  <li key={item}>+ {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-500">Weaknesses</p>
              <ul className="space-y-2 text-slate-300">
                {(dashboard.analysis?.weaknesses || []).map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </GlassCard>

        <PredictionChart probabilities={dashboard.prediction?.probabilities} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Daily Quests</p>
            <h2 className="mt-2 text-3xl font-semibold">Upside Down Multiplier</h2>
          </div>
          <button type="button" onClick={handleGenerateQuests} className="rounded-full bg-white/[0.08] px-5 py-3 text-sm text-slate-200">
            Generate Quests
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(dashboard.quests || []).map((quest) => (
            <QuestCard key={quest._id} quest={quest} onComplete={handleCompleteQuest} />
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default DashboardPage;
