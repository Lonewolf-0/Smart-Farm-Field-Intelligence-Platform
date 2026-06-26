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

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate === dateStr);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 z-10 relative">
        <h3 className="text-xl font-bold text-white">Upcoming week</h3>
      </div>

      <div className="flex justify-between items-end flex-1 z-10 relative mb-8">
        {weekDays.map((date, i) => {
          const dayTasks = getTasksForDate(date);
          const hasWork = dayTasks.length > 0;
          
          return (
            <div key={i} className="flex flex-col items-center gap-3 group relative cursor-pointer">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              
              <div className={`w-12 rounded-full flex flex-col overflow-hidden font-bold text-white shadow-lg transition-all ${hasWork ? 'h-24' : 'h-12 bg-white/5 border border-white/10 text-slate-300'}`}>
                {hasWork ? (
                  <div className="flex flex-col h-full w-full relative">
                    {/* Background segments */}
                    <div className="absolute inset-0 flex flex-col w-full h-full">
                      {dayTasks.map((task, idx) => (
                        <div key={idx} className={`flex-1 w-full ${getCategoryColor(task.category)}`}></div>
                      ))}
                    </div>
                    {/* Centered Date Text */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 drop-shadow-md">
                      {date.getDate()}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full w-full">
                    {date.getDate()}
                  </div>
                )}
              </div>
              
              {/* Tooltip */}
              {hasWork && (
                <div className="absolute bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap text-white text-xs py-2 px-3 rounded-lg shadow-xl shadow-black/20 bg-slate-800 border border-white/10 flex flex-col gap-1.5">
                  {dayTasks.map((task, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 font-bold">
                      <div className={`w-2 h-2 rounded-full ${getCategoryColor(task.category)}`}></div>
                      {task.title}
                    </div>
                  ))}
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
