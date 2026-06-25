import React from "react";
import type { Task } from "../../types";
import { ArrowUpRight } from "lucide-react";

interface Props {
  tasks: Task[];
}

const UpcomingWeekWidget: React.FC<Props> = ({ tasks }) => {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Plowing': return 'bg-amber-500';
      case 'Fertilization': return 'bg-emerald-600';
      case 'Shipment': return 'bg-yellow-400';
      default: return 'bg-slate-700'; // No work / Default
    }
  };

  const getTaskForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.find(t => t.dueDate === dateStr);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 z-10 relative">
        <h3 className="text-xl font-bold text-white">Upcoming week</h3>
      </div>

      <div className="flex justify-between items-end flex-1 z-10 relative mb-8">
        {weekDays.map((date, i) => {
          const task = getTaskForDate(date);
          const hasWork = !!task;
          const colorClass = getCategoryColor(task?.category);
          
          return (
            <div key={i} className="flex flex-col items-center gap-3 group relative cursor-pointer">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <div className={`w-12 rounded-full flex items-center justify-center font-bold text-white transition-all shadow-lg ${hasWork ? 'h-24 ' + colorClass : 'h-12 bg-white/5 border border-white/10 text-slate-300'}`}>
                {date.getDate()}
              </div>
              
              {/* Tooltip */}
              {hasWork && (
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap text-white text-xs py-1.5 px-3 rounded-lg shadow-xl shadow-black/20 font-bold ${colorClass}`}>
                  {task.title}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-auto z-10 relative text-xs font-medium text-slate-300">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
          Plowing
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-600"></div>
          Fertilization
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
          Shipment
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700"></div>
          No work
        </div>
      </div>
    </div>
  );
};

export default UpcomingWeekWidget;
