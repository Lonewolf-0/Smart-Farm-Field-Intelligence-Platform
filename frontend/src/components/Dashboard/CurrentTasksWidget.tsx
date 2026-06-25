import React from "react";
import type { Task } from "../../types";
import { ArrowUpRight } from "lucide-react";

interface Props {
  tasks: Task[];
}

const CurrentTasksWidget: React.FC<Props> = ({ tasks }) => {
  // Sort tasks to show overdue/soonest first
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const displayTasks = sortedTasks.slice(0, 2);

  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Current tasks</h3>
        <button className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
          <ArrowUpRight className="h-4 w-4 text-slate-300" />
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {displayTasks.map((task) => {
          const daysDiff = task.dueDate ? getDaysDiff(task.dueDate) : 0;
          const isOverdue = daysDiff < 0;
          const colorClass = isOverdue 
            ? "bg-red-500/90 text-white" 
            : "bg-emerald-500/90 text-white";
          
          return (
            <div key={task.id} className="flex bg-slate-800/80 rounded-2xl border border-white/10 overflow-hidden shadow-lg h-[110px] items-center p-2 gap-4">
              {/* Day Badge */}
              <div className={`h-full aspect-square rounded-xl ${colorClass} flex flex-col items-center justify-center font-bold shadow-inner shrink-0`}>
                <span className="text-xl leading-none">{Math.abs(daysDiff)}d</span>
                <span className="text-xs font-medium opacity-90">{isOverdue ? "due" : "left"}</span>
              </div>
              
              {/* Content */}
              <div className="flex flex-col justify-center py-2 pr-4 flex-1">
                <p className="text-sm font-semibold text-slate-200 leading-snug">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-medium ${isOverdue ? "text-red-400" : "text-emerald-400"}`}>
                    {isOverdue ? `You have ${Math.abs(daysDiff)} days of delay.` : `Required in ${daysDiff} days.`}
                  </span>
                </div>
                {task.category && (
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white/5 text-slate-400 w-fit">
                    {task.category}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {displayTasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <p className="text-sm">No current tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentTasksWidget;
