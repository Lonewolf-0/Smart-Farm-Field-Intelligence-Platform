import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useField } from "../context/FieldContext";
import { useState } from "react";
import CurrentTasksWidget from "../components/Dashboard/CurrentTasksWidget";
import UpcomingWeekWidget from "../components/Dashboard/UpcomingWeekWidget";
import FieldSummaryCard from "../components/Dashboard/FieldSummaryCard";
import WeatherWidget from "../components/Dashboard/WeatherWidget";
import type { Task } from "../types";



function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { fields: savedFields } = useField();
  
  // Mock data for tasks
  const [tasks] = useState<Task[]>([
    { 
      id: "1", 
      userId: "u1", 
      title: "Scheduled spraying was not performed.", 
      completed: false, 
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Plowing'
    },
    { 
      id: "2", 
      userId: "u1", 
      title: "Field fertilization required in the 3 days. Wheat #2", 
      completed: false, 
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Fertilization'
    },
    {
      id: "3",
      userId: "u1",
      title: "Delivery pickup scheduled.",
      completed: false,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Shipment'
    }
  ]);

  if (isAuthenticated && user) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard</h2>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-400">Field</span>
            <div className="bg-slate-800 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-700 transition-colors">
              <span className="text-sm font-semibold text-white">All fields</span>
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Top Row: Tasks & Week Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div className="bg-slate-800/30 rounded-3xl p-6 border border-white/5">
            <CurrentTasksWidget tasks={tasks} />
          </div>
          <div className="h-[340px]">
            <UpcomingWeekWidget tasks={tasks} />
          </div>
        </div>

        {/* Bottom Row: Field Summaries (Fallback for skipped Crop/Harvest charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="h-80">
            <FieldSummaryCard fields={savedFields} />
          </div>
          <div className="h-80">
            <WeatherWidget />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            A clean routed start for the Smart Farm platform.
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/map" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20">
              Open the map <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage;
