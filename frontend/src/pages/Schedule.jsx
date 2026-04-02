import { useState } from "react";
import axios from "axios";
import ScheduleTable from "../components/ScheduleTable.jsx";

const toMinutes = (timeStr) => {
  if (!timeStr) return Number.NaN;
  const parts = String(timeStr).split(":").map(Number);
  if (parts.length < 2 || parts.some((p) => Number.isNaN(p))) return Number.NaN;
  const [h, m] = parts;
  return (h - 7) * 60 + m;
};

export default function Schedule() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [schedule, setSchedule] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const generate = async () => {
    const res = await axios.post("/api/schedule", { date, num_cases: 60 });

    const byRoom = res.data.schedule.reduce((acc, item) => {
      if (!acc[item.or_room]) acc[item.or_room] = [];
      const startMinute = toMinutes(item.start_time);
      const endMinute = toMinutes(item.end_time);
      acc[item.or_room].push({
        ...item,
        start_minute: startMinute,
        end_minute: endMinute,
      });
      return acc;
    }, {});

    const roomRows = Object.keys(byRoom).sort().map((room) => {
      const cases = byRoom[room]
        .map((item, idx) => {
          const startMinute = Number.isFinite(item.start_minute) ? item.start_minute : null;
          const endMinute = Number.isFinite(item.end_minute) ? item.end_minute : null;
          if (startMinute !== null && endMinute !== null && endMinute >= startMinute) {
            return item;
          }
          const fallbackStart = idx === 0 ? 0 : (Number.isFinite(cases[idx - 1]?.end_minute) ? cases[idx - 1].end_minute : idx * 30);
          const fallbackEnd = fallbackStart + (item.predicted_duration_mins || 30);
          return {
            ...item,
            start_minute: fallbackStart,
            end_minute: fallbackEnd,
          };
        })
        .sort((a, b) => (a.start_minute || 0) - (b.start_minute || 0));
      return { or_room: room, cases };
    });

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
