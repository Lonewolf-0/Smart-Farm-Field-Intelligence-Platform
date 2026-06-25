import React from "react";
import type { Task } from "../../types";
import { Plus, Check } from "lucide-react";

interface Props {
  tasks: Task[];
  onAddTaskClick?: () => void;
  onCompleteTask?: (id: string) => void;
}

const CurrentTasksWidget: React.FC<Props> = ({ tasks, onAddTaskClick, onCompleteTask }) => {
  // Sort tasks to show overdue/soonest first
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });



  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Plowing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Fertilization': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Shipment': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      default: return 'bg-slate-800/80 text-slate-400 border-white/5';
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Current tasks</h3>
        <button 
          onClick={onAddTaskClick}
          className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
          title="Add New Task"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
        {sortedTasks.map((task) => {
          const daysDiff = task.dueDate ? getDaysDiff(task.dueDate) : 0;
          const isOverdue = daysDiff < 0;
          
          return (
            <div key={task.id} className="flex bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 shadow-sm items-center p-3 gap-4 shrink-0 transition-all group">
              {/* Content */}
              <div className="flex flex-col flex-1">
                <p className="text-sm font-semibold text-white leading-snug group-hover:text-emerald-300 transition-colors">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Urgency Pill */}
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${isOverdue ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                    {isOverdue ? `${Math.abs(daysDiff)}d overdue` : `${daysDiff}d left`}
                  </div>
                  
                  {/* Category Pill */}
                  {task.category && (
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${getCategoryColor(task.category)}`}>
                      {task.category}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="shrink-0 flex items-center pr-1">
                <button 
                  onClick={() => onCompleteTask && onCompleteTask(task.id)}
                  className="h-8 w-8 rounded-full border border-white/20 bg-slate-900/50 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:border-emerald-400 hover:text-slate-950 transition-all shadow-sm group-hover:border-emerald-500/50"
                  title="Mark as completed"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {sortedTasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <p className="text-sm">No current tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentTasksWidget;
