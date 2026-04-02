import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PipelineStatus from "../components/PipelineStatus.jsx";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const initialStages = [
  { name: "Data Generation", status: "idle", detail: "Awaiting raw data" },
  { name: "LLM Pre-processing", status: "idle", detail: "Normalize EHR records" },
  { name: "Graph Construction", status: "idle", detail: "Build synergy graph" },
  { name: "GNN Training", status: "idle", detail: "Train GraphSAGE" },
  { name: "Schedule Generation", status: "idle", detail: "Generate OR plan" },
];

export default function Dashboard() {
  const [stages, setStages] = useState(initialStages);
  const [metrics, setMetrics] = useState({
    totalCases: "-",
    uniqueSurgeons: "-",
    avgDuration: "-",
    idleTime: "-",
  });
  const [lossHistory, setLossHistory] = useState([]);

  useEffect(() => {
    axios.get("/api/status").then((res) => {
      if (res.data.has_raw_data) {
        setStages((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], status: "done", detail: "or_data.csv ready" };
          return next;
        });
      }
    });
  }, []);

  const updateStage = (index, patch) => {
    setStages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const runFullPipeline = async () => {
    updateStage(1, { status: "running", detail: "Normalizing records" });
    const preprocess = await axios.post("/api/preprocess", null, { params: { limit: 500 } });
    updateStage(1, {
      status: "done",
      detail: `${preprocess.data.records_processed} records processed`,
    });

    updateStage(2, { status: "running", detail: "Constructing graph" });
    const graph = await axios.get("/api/graph-data");
    updateStage(2, {
      status: "done",
      detail: `${graph.data.stats.num_nodes} nodes, ${graph.data.stats.num_edges} edges`,
    });

    updateStage(3, { status: "running", detail: "Training GraphSAGE" });
    const train = await axios.post("/api/train");
    updateStage(3, { status: "done", detail: `Loss ${train.data.final_loss.toFixed(4)}` });
    setLossHistory(train.data.loss_history.map((loss, idx) => ({ epoch: idx + 1, loss })));

    updateStage(4, { status: "running", detail: "Allocating OR slots" });
    const schedule = await axios.post("/api/schedule", { num_cases: 20 });
    updateStage(4, { status: "done", detail: `${schedule.data.metrics.total_cases_scheduled} cases scheduled` });

    const surgeonCount = graph.data.nodes.filter((n) => n.role === "surgeon").length;
    const avgDuration = schedule.data.schedule.reduce((sum, c) => sum + c.predicted_duration_mins, 0) / schedule.data.schedule.length;

    setMetrics({
      totalCases: preprocess.data.records_processed,
      uniqueSurgeons: surgeonCount,
      avgDuration: `${avgDuration.toFixed(1)} min`,
      idleTime: `${schedule.data.metrics.total_idle_time_mins} min`,
    });
  };

  const chartData = useMemo(() => lossHistory, [lossHistory]);

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Pipeline Control</p>
        <h2 className="font-display text-3xl">LLM-Guided OR Scheduling Pipeline</h2>
        <button
          onClick={runFullPipeline}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]"
        >
          Run Full Pipeline
        </button>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        {stages.map((stage) => (
          <PipelineStatus key={stage.name} stage={stage} />
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Cases", value: metrics.totalCases },
          { label: "Unique Surgeons", value: metrics.uniqueSurgeons },
          { label: "Avg Predicted Duration", value: metrics.avgDuration },
          { label: "Idle Time", value: metrics.idleTime },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white p-6 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
            <p className="mt-4 text-2xl font-display">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">GNN Training Loss</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">GraphSAGE</span>
        </div>
        <div className="mt-6 h-60">
          {chartData.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-slate-400">Run training to view loss curve.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="epoch" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="loss" stroke="#5B8CFF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
