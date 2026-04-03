import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import UserAvatar from "../components/UserAvatar.jsx";
import { ArrowRightIcon, SparklesIcon, TargetIcon, TrendUpIcon, UserIcon, ZapIcon } from "../components/V0Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  name: "",
  email: "",
  password: "",
  age: "",
  goals: "",
  habits: ""
};

const parseCommaValues = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildInsight = (goals, habits) => {
  if (!goals.length) {
    return "Set your first goal to activate your timeline direction.";
  }

  const hasHealthHabit = habits.some((habit) => /meditation|run|gym|workout|yoga|sleep|water|walk/i.test(habit));
  const hasLearningHabit = habits.some((habit) => /read|code|learn|study|course|book|tutorial|podcast/i.test(habit));
  const hasRoutineHabit = habits.some((habit) => /journal|plan|morning|routine|focus|deep work/i.test(habit));

  let message = `Primary direction: ${goals[0]}. `;

  if (!habits.length) {
    return `${message}Add one repeatable habit so your future can start compounding.`;
  }

  if (hasHealthHabit) {
    message += "Your wellness habits are building resilience. ";
  }

  if (hasLearningHabit) {
    message += "Learning habits are creating upward momentum. ";
  }

  if (hasRoutineHabit) {
    message += "Consistency is becoming part of your identity. ";
  }

  if (!hasHealthHabit && !hasLearningHabit && !hasRoutineHabit) {
    message += "Your current habits are seeds; keep repeating them with intention. ";
  }

  return `${message}${habits.length} active habit pattern${habits.length > 1 ? "s" : ""} detected.`;
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState(initialForm);
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState("");
  const [otpDevPreview, setOtpDevPreview] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [previewPulse, setPreviewPulse] = useState(false);

  const parsedGoals = useMemo(() => parseCommaValues(form.goals), [form.goals]);
  const parsedHabits = useMemo(() => parseCommaValues(form.habits), [form.habits]);

  const previewEmail = form.email.trim() || "anonymous@multiverse.ai";
  const guidance = useMemo(() => buildInsight(parsedGoals, parsedHabits), [parsedGoals, parsedHabits]);

  useEffect(() => {
    if (!previewPulse) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setPreviewPulse(false), 500);
    return () => window.clearTimeout(timeout);
  }, [previewPulse]);

  useEffect(() => {
    setOtpStep(false);
    setOtpPurpose("");
    setOtpCode("");
    setOtpDevPreview("");
    setOtpEmail("");
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let response;

      if (mode === "signup" && !otpStep) {
        const payload = {
          ...form,
          age: form.age ? Number(form.age) : undefined,
          goals: parsedGoals,
          habits: parsedHabits
        };

        response = await api.signup(payload);

        if (response.otpRequired) {
          setOtpStep(true);
          setOtpPurpose("signup");
          setOtpEmail(response.email || form.email.trim().toLowerCase());
          setOtpDevPreview(response.devOtpPreview || "");
          setOtpCode("");
          setPreviewPulse(true);
          setSubmitting(false);
          return;
        }

        saveSession(response);
        navigate(response.user.mlPrediction ? "/dashboard" : "/quiz");
        return;
      }

      if (mode === "signup" && otpStep) {
        response = await api.verifySignupOtp({
          email: otpEmail || form.email,
          otp: otpCode
        });

        saveSession(response);
        navigate(response.user.mlPrediction ? "/dashboard" : "/quiz");
        return;
      }

      if (mode === "login" && !otpStep) {
        response = await api.login({ email: form.email, password: form.password });

        if (response.otpRequired) {
          setOtpStep(true);
          setOtpPurpose("login");
          setOtpEmail(response.email || form.email.trim().toLowerCase());
          setOtpDevPreview(response.devOtpPreview || "");
          setOtpCode("");
          setPreviewPulse(true);
          setSubmitting(false);
          return;
        }

        saveSession(response);
        navigate(response.user.mlPrediction ? "/dashboard" : "/quiz");
        return;
      }

      if (mode === "login" && otpStep) {
        response = await api.verifyLoginOtp({
          email: otpEmail || form.email,
          otp: otpCode
        });

        saveSession(response);
        navigate(response.user.mlPrediction ? "/dashboard" : "/quiz");
        return;
      }

      throw new Error("Invalid auth state.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-parallel-grid px-4 py-8 text-slate-900 md:px-6 md:py-10">
      <div className="report-ambient pointer-events-none fixed inset-0">
        <div className="report-ambient-orb report-ambient-orb-left" />
        <div className="report-ambient-orb report-ambient-orb-right" />
        <div className="report-stars" />
      </div>

      <div className="auth-workspace-shell relative mx-auto max-w-7xl">
        <div className="auth-workspace-card">
          <div className="auth-workspace-grid">
            <section className="auth-panel auth-identity-panel">
              <div className="auth-header-row">
                <div>
                  <Link to="/" className="inline-flex items-center gap-3">
                    <div className="soft-button flex h-11 w-11 items-center justify-center rounded-full">
                      <SparklesIcon className="h-5 w-5 text-slate-950" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold gradient-brand-text">multiverse ai</h1>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">timeline workspace · future alignment</p>
                    </div>
                  </Link>
                </div>
                <div className="auth-account-badge">
                  <SparklesIcon className="h-4 w-4 text-sky-600" />
                  <span>{mode === "signup" ? "new account" : otpStep ? "otp verification" : "returning access"}</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="auth-preview-title">
                  <TrendUpIcon className="h-5 w-5 text-sky-600" />
                  <span>Identity Preview · Your Future Self</span>
                </div>

                <div className={`auth-preview-card ${previewPulse ? "auth-preview-card-pulse" : ""}`}>
                  <div className="auth-profile-row">
                    <div className="auth-profile-icon">
                      <UserIcon className="h-6 w-6 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-slate-900">{mode === "signup" ? "Future Self Timeline" : "Workspace Access"}</div>
                      <div className="auth-email-highlight">{previewEmail}</div>
                    </div>
                  </div>

                  {mode === "signup" ? (
                    <>
                      <div className="mt-5">
                        <span className="auth-section-label">
                          <TargetIcon className="h-3.5 w-3.5 text-sky-600" />
                          Core goals
                        </span>
                        <div className="auth-chip-list">
                          {parsedGoals.length ? (
                            parsedGoals.map((goal) => (
                              <span key={goal} className="auth-goal-chip">
                                <TargetIcon className="h-3 w-3 text-sky-600" />
                                {goal}
                              </span>
                            ))
                          ) : (
                            <span className="auth-goal-chip">
                              <SparklesIcon className="h-3 w-3 text-sky-600" />
                              No goals yet
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5">
                        <span className="auth-section-label">
                          <ZapIcon className="h-3.5 w-3.5 text-cyan-600" />
                          Current habits
                        </span>
                        <div className="auth-chip-list">
                          {parsedHabits.length ? (
                            parsedHabits.map((habit) => (
                              <span key={habit} className="auth-habit-chip">
                                <ZapIcon className="h-3 w-3 text-cyan-600" />
                                {habit}
                              </span>
                            ))
                          ) : (
                            <span className="auth-habit-chip">
                              <SparklesIcon className="h-3 w-3 text-cyan-600" />
                              Add habits
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-5 rounded-[1.2rem] border border-sky-100 bg-white/70 p-4 text-sm leading-7 text-slate-600">
                      Sign in to continue with your saved scan history, habits, goals, and future guidance.
                    </div>
                  )}
                </div>

                <div className="auth-guidance-card">
                  <SparklesIcon className="mt-0.5 h-5 w-5 text-sky-600" />
                  <span>
                    {mode === "signup"
                      ? (otpStep
                          ? "An OTP has been sent to your email. Verify to activate your new account."
                          : guidance)
                      : otpStep
                        ? "Your password is confirmed. Enter the OTP to finish signing in."
                        : "Your workspace is ready. Login to continue where you left off."}
                  </span>
                </div>
              </div>
            </section>

            <section className="auth-panel auth-form-panel">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Enter The Calendar</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">{mode === "signup" ? "Enter multiverse ai" : "Return to multiverse ai"}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                  className="soft-button-secondary rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/90"
                >
                  {mode === "signup" ? "Have an account?" : "Need an account?"}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  {mode === "signup" ? (
                    <>
                      <label className="auth-input-group">
                        <span>Name</span>
                        <input
                          className="input-field"
                          placeholder="Your name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </label>
                      <label className="auth-input-group">
                        <span>Age</span>
                        <input
                          className="input-field"
                          placeholder="Your age"
                          type="number"
                          value={form.age}
                          onChange={(e) => setForm({ ...form, age: e.target.value })}
                        />
                      </label>
                    </>
                  ) : null}

                  <label className="auth-input-group sm:col-span-2">
                    <span>Email address</span>
                    <input
                      className="input-field"
                      placeholder="your@email.com"
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (otpStep) {
                          setOtpStep(false);
                          setOtpPurpose("");
                          setOtpCode("");
                          setOtpDevPreview("");
                          setOtpEmail("");
                        }
                      }}
                      required
                    />
                  </label>

                  <label className="auth-input-group sm:col-span-2">
                    <span>Password</span>
                    <input
                      className="input-field"
                      placeholder="Password"
                      type="password"
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value });
                        if (otpStep) {
                          setOtpStep(false);
                          setOtpPurpose("");
                          setOtpCode("");
                          setOtpDevPreview("");
                          setOtpEmail("");
                        }
                      }}
                      required
                    />
                  </label>

                  {otpStep ? (
                    <label className="auth-input-group sm:col-span-2">
                      <span>{otpPurpose === "signup" ? "Email verification OTP" : "Login OTP"}</span>
                      <input
                        className="input-field"
                        placeholder="Enter 6-digit OTP"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                      />
                    </label>
                  ) : null}

                  {mode === "signup" ? (
                    <>
                      <label className="auth-input-group sm:col-span-2">
                        <span>Goals (comma separated)</span>
                        <textarea
                          className="input-field min-h-28"
                          placeholder="Launch AI tool, Run marathon, Build portfolio"
                          value={form.goals}
                          onChange={(e) => setForm({ ...form, goals: e.target.value })}
                        />
                      </label>
                      <label className="auth-input-group sm:col-span-2">
                        <span>Current habits (comma separated)</span>
                        <textarea
                          className="input-field min-h-28"
                          placeholder="Morning planning, Daily journal, Code 2 hours"
                          value={form.habits}
                          onChange={(e) => setForm({ ...form, habits: e.target.value })}
                        />
                      </label>
                    </>
                  ) : null}
                </div>

                <div className="auth-action-row">
                  <button
                    type="button"
                    onClick={() => {
                      if (otpStep) {
                        setOtpCode("");
                        setOtpDevPreview("");
                        setOtpStep(false);
                        setOtpPurpose("");
                        setPreviewPulse(true);
                        return;
                      }
                      setPreviewPulse(true);
                    }}
                    className="soft-button-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium"
                  >
                    <SparklesIcon className="mr-2 h-4 w-4" />
                    {mode === "login" && otpStep ? "Edit login details" : "Update timeline"}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="soft-button inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Syncing..." : otpStep ? "Verify OTP" : mode === "signup" ? "Enter multiverse ai" : "Send OTP"}
                    {!submitting ? <ArrowRightIcon className="ml-2 h-5 w-5" /> : null}
                  </button>
                </div>

                <div className="auth-timeline-preview">
                  <div className="auth-sync-line">
                    <TrendUpIcon className="h-4 w-4 text-sky-600" />
                    <span>Future guidance syncs with your goals and habits</span>
                  </div>
                  <div className="auth-future-message">
                    {mode === "signup"
                      ? otpStep
                        ? `Enter the OTP sent to ${otpEmail || previewEmail} to verify your new account.`
                        : parsedGoals.length
                          ? `Your direction is taking shape around ${parsedGoals.slice(0, 2).join(", ")}.`
                          : "Set your intentions to unlock clearer future guidance."
                      : otpStep
                        ? `Enter the OTP sent to ${otpEmail || previewEmail} to complete login.`
                        : "Login to receive a one-time passcode and reopen your saved workspace."}
                  </div>
                  {mode === "login" && otpStep && otpDevPreview ? (
                    <div className="mt-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      Dev OTP preview: <strong>{otpDevPreview}</strong>
                    </div>
                  ) : mode === "signup" && otpStep && otpDevPreview ? (
                    <div className="mt-3 rounded-[1rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                      Dev signup OTP preview: <strong>{otpDevPreview}</strong>
                    </div>
                  ) : null}
                </div>

                {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}
              </form>
            </section>
          </div>

          <div className="auth-footer-note">
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>one workspace · scans · goals · habits · future guidance</span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthPage;
