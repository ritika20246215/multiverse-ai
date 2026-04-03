import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function SkillGapChart({ skillsAnalysis, gapAnalysis }) {
  const categoryScores = skillsAnalysis?.category_scores || {};
  const gapItems = gapAnalysis?.gaps || [];

  const barData = {
    labels: Object.keys(categoryScores),
    datasets: [
      {
        label: "Skill score",
        data: Object.values(categoryScores),
        borderRadius: 12,
        backgroundColor: ["#2563eb", "#0ea5e9", "#38bdf8", "#7dd3fc"]
      }
    ]
  };

  const doughnutData = {
    labels: ["Covered", "Gap"],
    datasets: [
      {
        data: [gapAnalysis?.coverage_percent || 0, 100 - (gapAnalysis?.coverage_percent || 0)],
        backgroundColor: ["#2563eb", "#dbeafe"],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="rounded-3xl bg-slate-950/[0.03] p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Baseline skill signals</h3>
          <p className="text-sm text-slate-500">Sentence-BERT style mapping across your BUISES categories.</p>
        </div>
        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 100, grid: { color: "#e2e8f0" } },
              x: { grid: { display: false } }
            }
          }}
        />
      </div>

      <div className="space-y-4 rounded-3xl bg-slate-950/[0.03] p-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Coverage vs gaps</h3>
          <p className="text-sm text-slate-500">Current readiness against target-role expectations.</p>
        </div>
        <div className="mx-auto max-w-[240px]">
          <Doughnut
            data={doughnutData}
            options={{ cutout: "72%", plugins: { legend: { position: "bottom" } } }}
          />
        </div>
        <div className="space-y-3">
          {gapItems.slice(0, 4).map((item) => (
            <div key={item.skill} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium capitalize text-slate-800">{item.skill}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.priority === "high" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                  {item.priority} priority
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-cyan-400" style={{ width: `${item.readiness}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
