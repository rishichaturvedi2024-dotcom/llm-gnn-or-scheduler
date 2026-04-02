export default function PipelineStatus({ stage }) {
  const statusColors = {
    idle: "bg-slate-100 text-slate-600",
    running: "bg-sky-100 text-sky-700",
    done: "bg-emerald-100 text-emerald-700",
    error: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">{stage.name}</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[stage.status]}`}>
          {stage.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">{stage.detail}</p>
    </div>
  );
}
