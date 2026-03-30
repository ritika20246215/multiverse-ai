import GlassCard from "./GlassCard.jsx";

const difficultyColors = {
  Easy: "text-emerald-300",
  Medium: "text-cyan-300",
  Hard: "text-fuchsia-300"
};

const QuestCard = ({ quest, onComplete }) => (
  <GlassCard className="flex h-full flex-col justify-between gap-5">
    <div>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">{quest.title}</h3>
        <span className={`text-sm font-medium ${difficultyColors[quest.difficulty]}`}>{quest.difficulty}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{quest.description}</p>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">+{quest.xpReward} XP</span>
      <button
        type="button"
        disabled={quest.completed}
        onClick={() => onComplete(quest._id)}
        className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {quest.completed ? "Completed" : "Mark Complete"}
      </button>
    </div>
  </GlassCard>
);

export default QuestCard;
