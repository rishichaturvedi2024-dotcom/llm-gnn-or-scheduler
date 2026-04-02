import { NavLink } from "react-router-dom";

const links = [
  { path: "/", label: "Dashboard" },
  { path: "/graph", label: "Graph" },
  { path: "/schedule", label: "Schedule" },
  { path: "/explain", label: "Explain" },
];

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-ink text-white grid place-items-center font-display text-sm">OR</div>
          <div>
            <p className="font-display text-sm uppercase tracking-[0.25em] text-slate-400">Research Demo</p>
            <h1 className="font-display text-lg">OR Scheduler</h1>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `pb-3 transition ${isActive ? "border-b-2 border-ink text-ink" : "text-slate-500 hover:text-ink"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
