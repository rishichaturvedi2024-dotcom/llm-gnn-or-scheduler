const HOURS = Array.from({ length: 12 }, (_, idx) => 7 + idx);

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
        <div key={row.or_room} className="relative mt-2 grid grid-cols-[140px_repeat(24,minmax(40px,1fr))] gap-1">
          <div className="text-sm font-semibold text-slate-600">{row.or_room}</div>
          <div className="col-span-24 relative h-12 rounded-xl bg-slate-100">
            {row.cases.map((item) => {
              const startSlot = Math.floor(item.start_slot);
              const endSlot = Math.ceil(item.end_slot);
              const riskColor =
                item.risk_level === "high" ? "bg-rose-500" : item.risk_level === "medium" ? "bg-amber-400" : "bg-emerald-500";
              return (
                <div
                  key={item.case_id}
                  title={`${item.procedure} | ${item.predicted_duration_mins} min | synergy ${item.team_synergy_score}`}
                  className={`absolute top-1 h-10 rounded-lg px-2 text-[10px] font-semibold text-white ${riskColor}`}
                  style={{
                    left: `${(startSlot / 24) * 100}%`,
                    width: `${((endSlot - startSlot) / 24) * 100}%`,
                  }}
                >
                  {item.case_id}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
