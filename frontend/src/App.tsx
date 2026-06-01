import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import {
  BarChart3,
  CloudSun,
  Grid2x2,
  Leaf,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import HomePage from "./pages/HomePage.tsx";
import MapPage from "./pages/MapPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import BranchesPage from "./pages/BranchesPage.tsx";
import Login from "./pages/Login.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";

const navItems = [
  { to: "/", label: "Home", icon: Grid2x2 },
  { to: "/map", label: "Map", icon: MapPinned },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/branches", label: "Branches", icon: Leaf },
  { to: "/login", label: "Login", icon: ShieldCheck },
  { to: "/register", label: "Register", icon: CloudSun },
] as const;

function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.18),_transparent_45%),linear-gradient(180deg,_#08111f_0%,_#0f172a_45%,_#111827_100%)] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">
              Smart Farm Field Intelligence Platform
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              Routed frontend scaffold
            </h1>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2 md:hidden">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "rounded-full border px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-200",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
