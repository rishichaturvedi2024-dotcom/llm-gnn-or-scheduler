import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import GraphView from "./pages/GraphView.jsx";
import Schedule from "./pages/Schedule.jsx";
import Explain from "./pages/Explain.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <div className="glow min-h-screen">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/explain" element={<Explain />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
