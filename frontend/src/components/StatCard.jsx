import GlassCard from "./GlassCard.jsx";

const StatCard = ({ label, value, accent }) => (
  <GlassCard className="relative overflow-hidden">
    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">{label}</p>
    <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
  </GlassCard>
);

export default StatCard;
