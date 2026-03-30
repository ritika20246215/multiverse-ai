import { useEffect, useState } from "react";
import { api } from "../api/client";
import GlassCard from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const FuturePage = () => {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    api.getDashboard(token).then(setDashboard);
  }, [token]);

  return (
    <div className="grid gap-6">
      <GlassCard>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Parallel Futures Engine</p>
          <h1 className="mt-3 text-4xl font-semibold">See the world built by your habits.</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            This comparison is generated from the ML prediction and then translated into immersive narrative simulations.
          </p>
        </div>
      </GlassCard>

      {dashboard?.simulation?.futureMessage ? (
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-300">Future Message</p>
          <p className="mt-4 text-lg leading-8 text-slate-200">{dashboard.simulation.futureMessage}</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <p className="text-slate-300">Complete the behavior scan to unlock your future simulations.</p>
        </GlassCard>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard>
          <div className="mb-5 inline-flex rounded-full bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
            Model Verdict
          </div>
          <p className="text-5xl font-semibold text-white">{dashboard?.prediction?.label || "Pending"}</p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            This result comes from the Random Forest predictor first, then Groq turns that signal into a future simulation and action plan.
          </p>
        </GlassCard>
        <GlassCard>
          <div className="mb-5 inline-flex rounded-full bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
            High Path
          </div>
          <p className="text-sm leading-7 text-slate-300">{dashboard?.simulation?.futureStory}</p>
        </GlassCard>
        <GlassCard>
          <div className="mb-5 inline-flex rounded-full bg-fuchsia-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-fuchsia-200">
            Drift Path
          </div>
          <p className="text-sm leading-7 text-slate-300">{dashboard?.simulation?.alternateStory}</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default FuturePage;
