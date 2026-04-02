const HOURS = Array.from({ length: 12 }, (_, idx) => 7 + idx);
const SHIFT_MINUTES = 12 * 60;

export default function ScheduleTable({ schedule }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <div className="grid grid-cols-[140px_repeat(24,minmax(40px,1fr))] gap-1 text-xs font-semibold text-slate-400">
        <div>OR Room</div>
        {HOURS.map((hour) => (
          <div key={hour} className="col-span-2 text-center">
            {hour}:00
          </div>
        ))}
      </div>
      {schedule.map((row) => (
        <div key={row.or_room} className="relative mt-3 grid grid-cols-[140px_repeat(24,minmax(40px,1fr))] gap-1">
          <div className="text-sm font-semibold text-slate-600">{row.or_room}</div>
          <div className="col-span-24 relative h-14 overflow-hidden rounded-xl border border-slate-100 bg-[linear-gradient(90deg,#F1F5F9_0,#F1F5F9_50%,#FFFFFF_50%,#FFFFFF_100%)] bg-[length:80px_100%]">
            {row.cases.map((item) => {
              const start = Math.max(0, item.start_minute || 0);
              const end = Math.min(SHIFT_MINUTES, item.end_minute || 0);
              const duration = Math.max(12, end - start);
              const riskColor =
                item.risk_level === "high" ? "bg-rose-500" : item.risk_level === "medium" ? "bg-amber-400" : "bg-emerald-500";
              return (
                <div
                  key={item.case_id}
                  title={`${item.procedure} | ${item.predicted_duration_mins} min | synergy ${item.team_synergy_score}`}
                  className={`absolute top-2 h-10 rounded-lg px-2 text-[10px] font-semibold text-white shadow ${riskColor}`}
                  style={{
                    left: `${(start / SHIFT_MINUTES) * 100}%`,
                    width: `${(duration / SHIFT_MINUTES) * 100}%`,
                    minWidth: "36px",
                  }}
                >
                  {item.case_id}
                  <span className="ml-2 text-[9px] opacity-80">{Math.round(item.predicted_duration_mins)}m</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
