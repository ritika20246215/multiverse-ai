const GlassCard = ({ className = "", children }) => (
  <div className={`rounded-3xl border border-white/10 bg-white/[0.08] p-6 shadow-[0_20px_60px_rgba(4,10,30,0.45)] backdrop-blur-xl ${className}`}>
    {children}
  </div>
);

export default GlassCard;
