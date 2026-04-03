import { motion } from "framer-motion";
import SkillGapChart from "./SkillGapChart";

export default function Dashboard({ profile, gapAnalysis, evaluation }) {
  const skills = profile?.skills || {};
  const goals = profile?.goals || {};
  const stats = [
    { label: "Detected skills", value: skills?.inferred_skills?.length || 0 },
    { label: "Goal match score", value: gapAnalysis?.match_score ? `${gapAnalysis.match_score}%` : "0%" },
    { label: "Active gaps", value: gapAnalysis?.skill_gaps?.gaps?.length || 0 },
    { label: "Latest evaluation", value: evaluation?.score ? `${evaluation.score}/100` : "--" }
  ];

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">BUISES Dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Personalized career intelligence</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Combine baseline signals, interpreted goals, insights, suggestions, evaluation, and a skill plan in one calm workspace.
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-cyan-500 px-5 py-4 text-white shadow-glow">
            <p className="text-sm opacity-80">Target roles</p>
            <p className="mt-1 text-lg font-semibold">{(goals.suggested_roles || []).join(", ") || "Not generated yet"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-3xl bg-slate-950/[0.03] p-5">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <SkillGapChart skillsAnalysis={skills} gapAnalysis={gapAnalysis?.skill_gaps} />

      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Goal interpretation</h3>
            <div className="mt-4 space-y-3">
              {(goals.short_term_breakdown || []).map((goal) => (
                <div key={goal} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  {goal}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Industry trend signals</h3>
            <div className="mt-4 space-y-4">
              {(gapAnalysis?.industry_trends || []).map((trend) => (
                <div key={trend.role} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-medium text-slate-900">{trend.role}</p>
                  <p className="mt-2 text-sm text-slate-500">{trend.trends.join(" • ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
