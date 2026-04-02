export default function ExplainCard({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <h3 className="font-display text-lg">{title}</h3>
      <div className="mt-4 text-sm text-slate-600">{children}</div>
    </div>
  );
}
