import { motion } from "framer-motion";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { navLinks } from "../data/navLinks";

const DashboardLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-parallel-grid px-5 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">Parallel You</p>
            <h1 className="mt-2 text-3xl font-semibold">Welcome back, {user?.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/app"}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition ${isActive ? "bg-cyan-400/20 text-cyan-200" : "bg-white/5 text-slate-300 hover:bg-white/10"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-4 py-2 text-sm text-fuchsia-200"
            >
              Logout
            </button>
          </div>
        </motion.header>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
