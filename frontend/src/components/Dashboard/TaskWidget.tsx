import React, { useState } from "react";
import type { Task } from "../../types";
import { CheckCircle2, Circle, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onAdd: (title: string, dueDate: string) => void;
}

const TaskWidget: React.FC<Props> = ({ tasks, onToggle, onAdd }) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAdd(newTaskTitle, newTaskDate);
    setNewTaskTitle("");
    setNewTaskDate("");
  };

  // Calendar logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Check if a day has a task
  const hasTaskOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.some(t => t.dueDate === dateStr && !t.completed);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 shadow-xl backdrop-blur-md h-full flex flex-col overflow-hidden lg:col-span-2">
      <div className="flex flex-col md:flex-row h-full">
        {/* Task List Section */}
        <div className="flex-1 p-6 flex flex-col border-b md:border-b-0 md:border-r border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Your Tasks
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar min-h-[200px] max-h-[300px]">
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No tasks. You're all caught up!</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                  <button onClick={() => onToggle(task.id)} className="shrink-0 text-slate-400 hover:text-emerald-400 transition-colors">
                    {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {task.title}
                    </p>
                  </div>
                  {task.dueDate && (
                    <div className="shrink-0 flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                      <CalendarIcon className="h-3 w-3" />
                      {task.dueDate}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAdd} className="mt-auto flex gap-2">
            <input
              type="text"
              placeholder="New task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 min-w-0"
            />
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="w-32 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 [color-scheme:dark] shrink-0"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center shrink-0"
            >
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Mini Calendar Section */}
        <div className="w-full md:w-64 p-6 bg-slate-950/30 flex flex-col justify-center border-t md:border-t-0 border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">{monthNames[month]} {year}</h4>
            <div className="flex gap-1">
              <button type="button" onClick={prevMonth} className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={nextMonth} className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-xs font-medium text-slate-500">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasTask = hasTaskOnDay(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              return (
                <div 
                  key={day} 
                  className={`relative h-7 w-7 mx-auto flex items-center justify-center text-xs rounded-full 
                    ${isToday ? 'bg-emerald-500 text-white font-bold' : 'text-slate-300'}
                    ${hasTask && !isToday ? 'bg-slate-700/50 font-semibold' : ''}
                  `}
                >
                  {day}
                  {hasTask && (
                    <div className={`absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-400'}`}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskWidget;
