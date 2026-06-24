import { ArrowRight, CheckCircle2, Map, Satellite, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useField } from "../context/FieldContext";
import { useState } from "react";
import UserProfileWidget from "../components/Dashboard/UserProfileWidget";
import WeatherWidget from "../components/Dashboard/WeatherWidget";
import FieldSummaryCard from "../components/Dashboard/FieldSummaryCard";
import TaskWidget from "../components/Dashboard/TaskWidget";
import type { Task } from "../types";

const highlights = [
  {
    title: "Map your field",
    description:
      "Draw boundaries and keep every parcel organized in one place.",
    icon: Map,
  },
  {
    title: "Analyze conditions",
    description:
      "See weather, soil, irrigation, and crop recommendations together.",
    icon: Satellite,
  },
  {
    title: "Plan smarter",
    description: "Use dashboard insights to make confident farm decisions.",
    icon: Sprout,
  },
];

function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { fields: savedFields } = useField();
  
  // Mock data for tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", userId: "u1", title: "Review soil test results for North Field", completed: false, dueDate: new Date().toISOString().split('T')[0] },
    { id: "2", userId: "u1", title: "Order fertilizer for spring season", completed: true, dueDate: "2026-06-15" }
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (title: string, dueDate: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.id || "u1",
      title,
      completed: false,
      dueDate
    };
    setTasks([...tasks, newTask]);
  };

  const totalFields = savedFields.length;
  const totalAcres = savedFields.reduce((acc, field) => acc + field.area, 0);

  if (isAuthenticated && user) {
    return (
      <div className="space-y-6">
        <UserProfileWidget user={user} totalFields={totalFields} totalAcres={totalAcres} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-80">
            <WeatherWidget />
          </div>
          <div className="lg:col-span-2 h-80">
            <FieldSummaryCard fields={savedFields} />
          </div>
        </div>

        <div className="h-96">
          <TaskWidget tasks={tasks} onToggle={toggleTask} onAdd={addTask} />
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            Placeholder pages ready
          </div>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            A clean routed start for the Smart Farm platform.
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            The frontend now has React Router wired in, Tailwind styling
            applied, and placeholder pages for each main workflow so the project
            can evolve in place.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/map"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              Open the map
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/analytics"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/5 hover:border-white/20"
            >
              View dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            What’s included
          </p>
          <div className="mt-4 space-y-4">
            {highlights.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl bg-white/5 p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/15 text-emerald-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;
