import { motion } from "framer-motion";

export default function Roadmap({ roadmap, onDownload }) {
  const milestones = roadmap?.weekly_milestones || [];

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">Skill Plan</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Roadmap with milestones</h2>
          <p className="mt-1 text-sm text-slate-500">{roadmap?.north_star || "Generate your roadmap to see next steps."}</p>
        </div>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Download roadmap PDF
        </button>
      </div>

      <div className="space-y-4">
        {milestones.length ? (
          milestones.map((milestone, index) => (
            <div key={milestone.id} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-400 text-sm font-bold text-white">
                  {index + 1}
                </div>
                {index < milestones.length - 1 ? <div className="mt-2 h-full w-px bg-slate-200" /> : null}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{milestone.title}</h3>
                    <p className="text-sm text-slate-500">
                      Week {milestone.target_week} • Due {milestone.due_date}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    {milestone.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">Time commitment: {milestone.time_commitment}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            Generate recommendations first to unlock the roadmap.
          </div>
        )}
      </div>
    </motion.section>
  );
}
