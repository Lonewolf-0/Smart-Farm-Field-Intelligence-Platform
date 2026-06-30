import React, { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { useField } from "../../context/FieldContext";

export interface TaskInput {
  title: string;
  dueDate: string;
  category: string;
  fieldId?: string;
}

interface AddTaskModalProps {
  onSave: (task: TaskInput) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  onSave,
  onCancel,
  isOpen,
}) => {
  const { fields } = useField();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [category, setCategory] = useState("Plowing");
  const [linkedFieldId, setLinkedFieldId] = useState("");

  const tomorrowStr = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  })();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave({
        title: title.trim(),
        dueDate,
        category,
        fieldId: linkedFieldId || undefined,
      });
      // Reset form
      setTitle("");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split("T")[0]);
      setCategory("Plowing");
      setLinkedFieldId("");
    }
  };

  const CATEGORIES = ["Plowing", "Fertilization", "Shipment", "Harvesting", "Maintenance", "Inspection", "Others"];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all">
        <h2 className="text-xl font-bold text-white mb-4">Add New Task</h2>
        <p className="text-sm text-slate-400 mb-6">
          Schedule a task to stay on top of your field operations.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="taskTitle" className="block text-sm font-medium text-slate-300 mb-1">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors"
              placeholder="e.g. Inspect irrigation lines"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300 mb-1">
              Due Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              min={tomorrowStr}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors appearance-none pr-10"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-800">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="linkedField" className="block text-sm font-medium text-slate-300 mb-1">
              Link to Field (Optional)
            </label>
            <div className="relative">
              <select
                id="linkedField"
                value={linkedFieldId}
                onChange={(e) => setLinkedFieldId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors appearance-none pr-10"
              >
                <option value="" className="bg-slate-800">No Farm / Unlinked</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-800">
                    {f.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2.5 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
