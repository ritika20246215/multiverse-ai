import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import GlassCard from "../components/GlassCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  name: "",
  email: "",
  password: "",
  age: "",
  goals: "",
  habits: ""
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        goals: form.goals.split(",").map((item) => item.trim()).filter(Boolean),
        habits: form.habits.split(",").map((item) => item.trim()).filter(Boolean)
      };

      const response =
        mode === "signup" ? await api.signup(payload) : await api.login({ email: form.email, password: form.password });

      saveSession(response);
      navigate(response.user.mlPrediction ? "/app" : "/quiz");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-parallel-grid px-6 py-10 text-white">
      <GlassCard className="w-full max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300">Access Gateway</p>
            <h1 className="mt-3 text-3xl font-semibold">{mode === "signup" ? "Create your Parallel You" : "Return to your timeline"}</h1>
          </div>
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
          >
            {mode === "signup" ? "Have an account?" : "Need an account?"}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {mode === "signup" && (
            <>
              <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="input-field" placeholder="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
            </>
          )}
          <input className="input-field sm:col-span-2" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input-field sm:col-span-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {mode === "signup" && (
            <>
              <textarea className="input-field min-h-28 sm:col-span-2" placeholder="Goals, comma separated" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} />
              <textarea className="input-field min-h-28 sm:col-span-2" placeholder="Current habits, comma separated" value={form.habits} onChange={(e) => setForm({ ...form, habits: e.target.value })} />
            </>
          )}
          {error ? <p className="sm:col-span-2 text-sm text-rose-300">{error}</p> : null}
          <button type="submit" disabled={submitting} className="sm:col-span-2 rounded-2xl bg-cyan-400 px-5 py-3 font-medium text-slate-950">
            {submitting ? "Syncing..." : mode === "signup" ? "Launch My Timeline" : "Login"}
          </button>
        </form>
      </GlassCard>
    </main>
  );
};

export default AuthPage;
