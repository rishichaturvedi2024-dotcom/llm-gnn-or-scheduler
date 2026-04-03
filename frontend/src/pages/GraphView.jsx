import { useEffect, useState } from "react";
import axios from "axios";
import TeamGraph from "../components/TeamGraph.jsx";

export default function GraphView() {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [stats, setStats] = useState({});
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get("/api/graph-data").then((res) => {
      const nodes = res.data.nodes.map((node) => ({ ...node }));
      const links = res.data.edges.map((edge) => ({ ...edge }));
      setGraph({ nodes, links });
      setStats(res.data.stats);
    });
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_1fr]">
      <div className="space-y-6 min-w-0">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Nodes", value: stats.num_nodes },
            { label: "Edges", value: stats.num_edges },
            { label: "Avg Degree", value: stats.avg_degree?.toFixed?.(2) },
            { label: "Density", value: stats.density?.toFixed?.(3) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-5 shadow-card">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
              <p className="mt-3 font-display text-xl">{item.value ?? "-"}</p>
            </div>
          ))}
        </div>
        <TeamGraph data={graph} onNodeClick={(node) => setSelected(node)} />
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#378ADD]"></span>Surgeon</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#1D9E75]"></span>Anaesthetist</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#D85A30]"></span>Scrub Nurse</div>
        </div>
      </div>
      <aside className="rounded-3xl bg-white p-8 shadow-card flex flex-col items-start min-w-[300px]">
        <h3 className="font-display text-2xl text-ink">Team Member Detail</h3>
        {selected ? (
          <div className="mt-8 flex w-full flex-col gap-6 text-base text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Staff ID</p>
              <p className="mt-1 font-display text-2xl text-ink">{selected.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
              <span className="mt-2 inline-flex rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-white">
                {selected.role}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Num Cases</p>
              <p className="mt-1 text-xl font-semibold">{selected.num_cases}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg Outcome</p>
              <p className="mt-1 text-xl font-semibold">{selected.avg_outcome?.toFixed?.(2)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg Complexity</p>
              <p className="mt-1 text-xl font-semibold">{selected.avg_complexity?.toFixed?.(2)}</p>
            </div>
            <div className="w-full">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Synergy Percentile</p>
              <div className="mt-3 h-3 w-full rounded-full bg-slate-200">
                <div className="h-3 rounded-full bg-sky" style={{ width: `${Math.min(100, (selected.avg_outcome || 0) * 10)}%` }}></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex h-[200px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
            Select a node in the graph on the left to inspect staff synergy details.
          </div>
        )}
      </aside>
    </div>
  );
}
