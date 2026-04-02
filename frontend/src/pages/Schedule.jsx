import { useState } from "react";
import axios from "axios";
import ScheduleTable from "../components/ScheduleTable.jsx";

const toSlot = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return (h - 7) * 2 + m / 30;
};

export default function Schedule() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [schedule, setSchedule] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const generate = async () => {
    const res = await axios.post("/api/schedule", { date, num_cases: 24 });

    const byRoom = res.data.schedule.reduce((acc, item) => {
      if (!acc[item.or_room]) acc[item.or_room] = [];
      acc[item.or_room].push({
        ...item,
        start_slot: toSlot(item.start_time),
        end_slot: toSlot(item.end_time),
      });
      return acc;
    }, {});

    const roomRows = Object.keys(byRoom).sort().map((room) => ({
      or_room: room,
      cases: byRoom[room],
    }));

    setSchedule(roomRows);
    setMetrics(res.data.metrics);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Schedule Builder</p>
          <h2 className="font-display text-3xl">Predict-then-Optimize OR Allocation</h2>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm"
          />
          <button
            onClick={generate}
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white"
          >
            Generate Schedule
          </button>
        </div>
      </header>

      {schedule.length > 0 ? <ScheduleTable schedule={schedule} /> : <div className="rounded-2xl bg-white p-8 shadow-card text-sm text-slate-500">Generate a schedule to view the gantt table.</div>}

      {metrics && (
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { label: "Total Scheduled", value: metrics.total_cases_scheduled },
            { label: "Idle Time", value: metrics.total_idle_time_mins },
            { label: "Avg Synergy", value: metrics.avg_team_synergy?.toFixed?.(2) },
            { label: "High Risk Cases", value: metrics.high_risk_cases },
            { label: "Utilisation %", value: metrics.utilisation_pct },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
              <p className="mt-3 font-display text-xl">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
