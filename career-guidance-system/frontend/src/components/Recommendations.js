import { motion } from "framer-motion";

export default function Recommendations({ recommendations, loading }) {
  const hasData = recommendations && Object.keys(recommendations).length;

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">Suggestions</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Your personalized improvement stack</h2>
        </div>
        <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">S</div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Generating GPT-powered recommendations...
        </div>
      ) : hasData ? (
        <div className="grid gap-5 xl:grid-cols-3">
          <RecommendationColumn title="Courses" items={recommendations.courses} formatter={(item) => `${item.platform} • ${item.duration}`} />
          <RecommendationColumn title="Mini-projects" items={recommendations.projects} formatter={(item) => item.estimated_time} />
          <RecommendationColumn title="Certifications" items={recommendations.certifications} formatter={(item) => `${item.provider} • ${item.cost}`} />
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
          Run the goal + gap flow to unlock recommendations.
        </div>
      )}
    </motion.section>
  );
}

function RecommendationColumn({ title, items = [], formatter }) {
  return (
    <div className="rounded-3xl bg-slate-950/[0.03] p-5">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {"description" in item ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                </div>
                {"priority" in item ? (
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{item.priority}</span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-slate-500">{formatter(item)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No recommendations yet.</p>
        )}
      </div>
    </div>
  );
}
