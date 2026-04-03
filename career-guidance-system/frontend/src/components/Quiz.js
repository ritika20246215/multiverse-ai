import { motion } from "framer-motion";

const baselineQuestions = [
  { key: "education", label: "Education background", placeholder: "B.Tech in CSE, self-taught developer, MBA..." },
  { key: "experience", label: "Experience snapshot", placeholder: "Internships, freelance work, clubs, projects..." },
  { key: "technical", label: "Technical strengths", placeholder: "Python, React, SQL, ML, APIs..." },
  { key: "communication", label: "Communication / teamwork strengths", placeholder: "Presentations, writing, stakeholder updates..." }
];

const evaluationQuestions = [
  "Explain how you would ship a feature from idea to production.",
  "Describe how your current strengths support your target role."
];

export default function Quiz({
  baselineAnswers,
  setBaselineAnswers,
  resumeText,
  setResumeText,
  onSubmitBaseline,
  submittingBaseline,
  evaluationAnswers,
  setEvaluationAnswers,
  onSubmitEvaluation,
  evaluating
}) {
  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">Baseline Assessment</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Map your current foundation</h2>
          </div>
          <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">B</div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {baselineQuestions.map((question) => (
            <label key={question.key} className="space-y-2">
              <span className="text-sm font-medium text-slate-700">{question.label}</span>
              <textarea
                rows={4}
                className="soft-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                placeholder={question.placeholder}
                value={baselineAnswers[question.key] || ""}
                onChange={(event) =>
                  setBaselineAnswers((current) => ({ ...current, [question.key]: event.target.value }))
                }
              />
            </label>
          ))}
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Optional resume / achievement text</span>
            <textarea
              rows={5}
              className="soft-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              placeholder="Paste your resume highlights, achievements, certifications, or portfolio summary..."
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onSubmitBaseline}
          disabled={submittingBaseline}
          className="mt-5 inline-flex items-center rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submittingBaseline ? "Analyzing baseline..." : "Run baseline analysis"}
        </button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="glass-panel p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">Evaluation</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Check your reasoning depth</h2>
          </div>
          <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700">E</div>
        </div>

        <div className="space-y-4">
          {evaluationQuestions.map((question) => (
            <label key={question} className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">{question}</span>
              <textarea
                rows={4}
                className="soft-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                placeholder="Write a short but thoughtful answer..."
                value={evaluationAnswers[question] || ""}
                onChange={(event) =>
                  setEvaluationAnswers((current) => ({ ...current, [question]: event.target.value }))
                }
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={onSubmitEvaluation}
          disabled={evaluating}
          className="mt-5 inline-flex items-center rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {evaluating ? "Scoring answers..." : "Evaluate answers"}
        </button>
      </motion.section>
    </div>
  );
}
