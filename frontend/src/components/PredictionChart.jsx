import GlassCard from "./GlassCard.jsx";

const toneMap = {
  High: "from-emerald-400 to-cyan-400",
  Average: "from-amber-400 to-orange-400",
  Negative: "from-rose-500 to-fuchsia-500"
};

const PredictionChart = ({ probabilities = {} }) => {
  const entries = ["High", "Average", "Negative"].map((label) => ({
    label,
    value: Math.round((probabilities[label] || 0) * 100)
  }));

  return (
    <GlassCard>
      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Prediction Confidence</p>
      <div className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div key={entry.label}>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>{entry.label}</span>
              <span>{entry.value}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/10">
              <div className={`h-3 rounded-full bg-gradient-to-r ${toneMap[entry.label]}`} style={{ width: `${entry.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default PredictionChart;
