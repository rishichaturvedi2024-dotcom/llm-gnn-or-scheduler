import { useEffect, useState } from "react";
import axios from "axios";
import ExplainCard from "../components/ExplainCard.jsx";

const PROCEDURES = [
  "Laparoscopic Cholecystectomy",
  "Total Knee Replacement",
  "Appendectomy",
  "Coronary Artery Bypass",
  "Hip Replacement",
  "Craniotomy",
  "Hysterectomy",
  "Prostatectomy",
  "Tonsillectomy",
  "Cataract Surgery",
  "Colectomy",
  "Hernia Repair",
  "Thyroidectomy",
  "Mastectomy",
  "Spinal Fusion",
  "Nephrectomy",
  "Carpal Tunnel Release",
  "Rotator Cuff Repair",
  "ACL Reconstruction",
  "CABG",
  "Bowel Resection",
  "Septoplasty",
  "Varicocelectomy",
  "Gastric Bypass",
  "Caesarean Section",
];

export default function Explain() {
  const [staff, setStaff] = useState({ surgeons: [], anaesthetists: [], nurses: [] });
  const [form, setForm] = useState({
    surgeon_id: "",
    anaesthetist_id: "",
    scrub_nurse_id: "",
    procedure: PROCEDURES[0],
    complexity: 3,
  });
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState(null);

  useEffect(() => {
    axios.get("/api/graph-data").then((res) => {
      const surgeons = res.data.nodes.filter((n) => n.role === "surgeon").map((n) => n.id);
      const anaesthetists = res.data.nodes.filter((n) => n.role === "anaesthetist").map((n) => n.id);
      const nurses = res.data.nodes.filter((n) => n.role === "scrub_nurse").map((n) => n.id);
      setStaff({ surgeons, anaesthetists, nurses });
      setForm((prev) => ({
        ...prev,
        surgeon_id: surgeons[0] || "",
        anaesthetist_id: anaesthetists[0] || "",
        scrub_nurse_id: nurses[0] || "",
      }));
    });
  }, []);

  const runExplain = async () => {
    const pred = await axios.post("/api/predict", form);
    setPrediction(pred.data);
    const explain = await axios.post("/api/explain", {
      ...form,
      ...pred.data,
    });
    setExplanation(explain.data);
  };

  const reRun = async () => {
    await runExplain();
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Explainability Console</p>
        <h2 className="font-display text-3xl">Predict + Explain Surgical Team Risk</h2>
      </header>

      <div className="grid gap-6 rounded-2xl bg-white p-6 shadow-card md:grid-cols-5">
        <select className="rounded-full border border-slate-200 px-4 py-2 text-sm" value={form.surgeon_id} onChange={(e) => setForm({ ...form, surgeon_id: e.target.value })}>
          {staff.surgeons.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        <select className="rounded-full border border-slate-200 px-4 py-2 text-sm" value={form.anaesthetist_id} onChange={(e) => setForm({ ...form, anaesthetist_id: e.target.value })}>
          {staff.anaesthetists.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        <select className="rounded-full border border-slate-200 px-4 py-2 text-sm" value={form.scrub_nurse_id} onChange={(e) => setForm({ ...form, scrub_nurse_id: e.target.value })}>
          {staff.nurses.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        <select className="rounded-full border border-slate-200 px-4 py-2 text-sm" value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })}>
          {PROCEDURES.map((proc) => (
            <option key={proc} value={proc}>{proc}</option>
          ))}
        </select>
        <select className="rounded-full border border-slate-200 px-4 py-2 text-sm" value={form.complexity} onChange={(e) => setForm({ ...form, complexity: Number(e.target.value) })}>
          {[1,2,3,4,5].map((value) => (
            <option key={value} value={value}>Complexity {value}</option>
          ))}
        </select>
        <button onClick={runExplain} className="md:col-span-5 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">Predict + Explain</button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ExplainCard title="GNN Prediction">
          {prediction ? (
            <div className="space-y-3">
              <div className="text-3xl font-display">{prediction.predicted_duration_mins} min</div>
              <div className="text-sm text-slate-500">CI: {prediction.confidence_interval[0]} - {prediction.confidence_interval[1]} min</div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.2em]">Synergy</span>
                <span className={prediction.team_synergy_score >= 0.7 ? "text-emerald-600" : prediction.team_synergy_score >= 0.4 ? "text-amber-600" : "text-rose-600"}>
                  {prediction.team_synergy_score}
                </span>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${prediction.risk_flag ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                {prediction.risk_flag ? "Risk Flagged" : "Low Risk"}
              </span>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Run a prediction to populate this panel.</div>
          )}
        </ExplainCard>

        <ExplainCard title="LLM Explanation">
          {explanation ? (
            <div className="space-y-4">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${explanation.risk_level === "high" ? "bg-rose-100 text-rose-700" : explanation.risk_level === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {explanation.risk_level}
              </span>
              <p>{explanation.rationale}</p>
              {explanation.suggested_adjustment && (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  {explanation.suggested_adjustment}
                </div>
              )}
              {explanation.re_predict && (
                <button onClick={reRun} className="rounded-full border border-ink px-4 py-2 text-xs font-semibold">
                  Re-run with adjusted weights
                </button>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Request an explanation to view LLM insights.</div>
          )}
        </ExplainCard>
      </div>
    </div>
  );
}
