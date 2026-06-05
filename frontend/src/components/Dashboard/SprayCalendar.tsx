import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";
import api from "../../services/api";

interface SprayCalendarProps {
  fieldId: string;
}

interface SprayLog {
  id: string;
  date: string;
  product: string;
  pest: string;
  status: "urgent" | "scheduled" | "completed";
}

const SprayCalendar: React.FC<SprayCalendarProps> = ({ fieldId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [logs, setLogs] = useState<SprayLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load or generate spray schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);

        // Fetch pesticide and weather to determine dynamic schedule
        const [pestRes, weatherRes] = await Promise.all([
          api.post(`/analysis/${fieldId}/pesticide`, { crop: "Wheat" }), // generic default, realistically you'd pass selected crop
          api.post(`/analysis/${fieldId}/weather`),
        ]);

        const highRiskPests = pestRes.data?.data?.assessments?.filter((a: any) => a.riskLevel === "High") || [];
        const forecast = weatherRes.data?.data?.forecast || [];

        // Load completed from localStorage to mimic storing in FieldAnalysis
        const storedLogs = JSON.parse(localStorage.getItem(`spray_history_${fieldId}`) || "[]");

        let generatedLogs: SprayLog[] = [...storedLogs];

        // Generate upcoming spray recommendations
        highRiskPests.forEach((pest: any) => {
          if (!pest.treatment) return;

          // Find a good day in the next 7 days without rain
          let bestDate = new Date();
          let foundWindow = false;

          for (let i = 0; i < forecast.length; i++) {
            if (forecast[i].precipitation < 5) {
              bestDate = new Date(forecast[i].date);
              foundWindow = true;
              break;
            }
          }

          if (!foundWindow) {
            // Default to tomorrow if no good weather
            bestDate.setDate(bestDate.getDate() + 1);
          }

          const dateStr = bestDate.toISOString().split("T")[0];

          // Check if already completed or scheduled
          if (!generatedLogs.find(l => l.pest === pest.pestName && l.date === dateStr)) {
            generatedLogs.push({
              id: `${pest.pestName}-${dateStr}`,
              date: dateStr,
              product: pest.treatment.productName,
              pest: pest.pestName,
              status: foundWindow ? "scheduled" : "urgent",
            });
          }
        });

        setLogs(generatedLogs);
      } catch (err) {
        console.error("Failed to load spray calendar data", err);
      } finally {
        setLoading(false);
      }
    };

    if (fieldId) {
      fetchSchedules();
    }
  }, [fieldId]);

  const markCompleted = (logId: string) => {
    const updatedLogs = logs.map(l => 
      l.id === logId ? { ...l, status: "completed" as const } : l
    );
    setLogs(updatedLogs);
    // Filter only completed to store
    const completed = updatedLogs.filter(l => l.status === "completed");
    localStorage.setItem(`spray_history_${fieldId}`, JSON.stringify(completed));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md animate-pulse min-h-[400px]">
        <div className="h-8 w-48 bg-slate-800 rounded mb-6"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-md h-full text-slate-200">
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Spray Calendar & Logging
          </h3>
          <div className="flex items-center gap-3 mt-1.5">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="text-slate-400 hover:text-white px-1"
            >
              &lt;
            </button>
            <p className="text-sm font-semibold text-cyan-200 min-w-[120px] text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="text-slate-400 hover:text-white px-1"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs font-semibold">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500"></span> Urgent</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Scheduled</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span> Completed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {blanks.map(b => (
          <div key={`blank-${b}`} className="min-h-[80px] rounded-lg bg-slate-900/20 border border-white/5 opacity-50"></div>
        ))}
        {days.map(day => {
          const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12).toISOString().split("T")[0];
          const dayLogs = logs.filter(l => l.date === dateStr);
          const isToday = new Date().toISOString().split("T")[0] === dateStr;

          return (
            <div 
              key={day} 
              className={`min-h-[80px] rounded-lg border p-1.5 flex flex-col gap-1 transition-colors ${
                isToday ? "bg-cyan-900/20 border-cyan-500/50" : "bg-slate-900/40 border-white/5"
              }`}
            >
              <div className={`text-right text-xs font-bold ${isToday ? "text-cyan-400" : "text-slate-500"}`}>
                {day}
              </div>
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                {dayLogs.map(log => {
                  let bgColor = "bg-green-500/20 text-green-300 border-green-500/30";
                  if (log.status === "urgent") bgColor = "bg-red-500/20 text-red-300 border-red-500/30";
                  if (log.status === "scheduled") bgColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";

                  return (
                    <div 
                      key={log.id} 
                      onClick={() => log.status !== "completed" && markCompleted(log.id)}
                      className={`text-[9px] p-1.5 rounded-md border leading-tight ${bgColor} ${log.status !== "completed" ? "cursor-pointer hover:brightness-125" : ""}`}
                      title={`${log.product} for ${log.pest}. Click to mark completed.`}
                    >
                      <div className="font-bold truncate">{log.product}</div>
                      <div className="truncate opacity-80">{log.pest}</div>
                      {log.status === "completed" && <CheckCircle className="w-3 h-3 mt-1 inline-block" />}
                      {log.status === "urgent" && <AlertTriangle className="w-3 h-3 mt-1 inline-block" />}
                      {log.status === "scheduled" && <ShieldAlert className="w-3 h-3 mt-1 inline-block" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SprayCalendar;
