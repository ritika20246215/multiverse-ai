import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HomePage = () => (
  <main className="relative min-h-screen overflow-hidden bg-parallel-grid px-6 py-12 text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(217,70,239,0.16),_transparent_25%)]" />
    <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center gap-12 lg:flex-row lg:items-center">
      <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.45em] text-cyan-300">Life Sim Protocol</p>
        <h1 className="mt-6 text-5xl font-semibold leading-tight sm:text-7xl">
          Parallel You
          <span className="block text-slate-300">Alternate Reality Simulator for Personal Growth</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Meet the disciplined version of yourself. Face the version that drifted. Turn both timelines into daily quests, XP, streaks, and meaningful momentum.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/auth" className="rounded-full bg-cyan-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-300">
            Enter the Simulator
          </Link>
          <Link to="/quiz" className="rounded-full border border-white/15 px-6 py-3 text-slate-200 transition hover:bg-white/[0.08]">
            Open Behavior Scan
          </Link>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="grid gap-4 sm:grid-cols-2">
        {[
          { label: "AI personality analysis", tone: "bg-white/10" },
          { label: "Groq-generated future simulations", tone: "bg-white/[0.06]" },
          { label: "Best vs worst timeline engine", tone: "bg-white/10" },
          { label: "Quest XP and streak loops", tone: "bg-white/[0.06]" }
        ].map((item) => (
          <div key={item.label} className={`rounded-[2rem] border border-white/10 ${item.tone} p-6 backdrop-blur-xl`}>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Core System</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">{item.label}</h2>
          </div>
        ))}
      </motion.div>
    </div>
  </main>
);

export default HomePage;
