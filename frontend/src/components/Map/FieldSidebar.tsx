import React from "react";
import { Pencil, Trash2, Check, X, Maximize2 } from "lucide-react";
import type { Field } from "../../types";

interface FieldSidebarProps {
  fields: Field[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onDeleteField: (id: string) => void;
  onEditField: (id: string, newName: string) => void;
  isLoading: boolean;
}

const FieldSidebar: React.FC<FieldSidebarProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onEditField,
  isLoading,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");

  const handleEditSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editName.trim()) {
      onEditField(id, editName.trim());
      setEditingId(null);
    }
  };
  return (
    <div className="w-80 h-full border-r border-white/10 bg-slate-950 flex flex-col z-[1000] shadow-xl relative overflow-hidden shrink-0">
      <div className="p-4 border-b border-white/10 bg-slate-900">
        <h2 className="text-lg font-bold text-white">My Fields</h2>
        <p className="text-sm text-slate-400">Saved boundaries</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <span className="animate-spin h-6 w-6 border-2 border-emerald-400 border-t-transparent rounded-full"></span>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center p-6 bg-white/5 rounded-xl border border-dashed border-white/10 mt-4">
            <p className="text-slate-500 text-sm">
              No fields saved yet. Draw a polygon on the map and click "Save Polygon".
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {fields.map((field) => (
              <li key={field.id} className="relative group">
                <button
                  onClick={() => {
                    if (editingId !== field.id) onSelectField(field.id);
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    selectedFieldId === field.id
                      ? "bg-emerald-900/20 border-emerald-500/50 shadow-sm shadow-emerald-900/20"
                      : "bg-white/5 border-white/10 hover:border-emerald-500/30 hover:bg-white/10"
                  }`}
                >
                  <div className="pr-16">
                    {editingId === field.id ? (
                      <form 
                        onSubmit={(e) => handleEditSubmit(e, field.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 text-sm border border-white/20 rounded-lg bg-white/5 text-white focus:outline-none focus:border-emerald-400"
                          autoFocus
                        />
                        <button 
                          type="submit"
                          className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 p-1 rounded-lg"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-slate-400 hover:text-slate-200 bg-white/10 p-1 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <h3 className="font-semibold text-white truncate">
                        {field.name}
                      </h3>
                    )}
                    <div className="flex items-center text-xs text-slate-400 mt-2 gap-3">
                      <span className="flex items-center gap-1">
                        <Maximize2 className="h-4 w-4" />
                        {field.area.toFixed(2)} ha / {(field.area * 2.47105).toFixed(2)} acres
                      </span>
                    </div>
                  </div>
                </button>
                
                {editingId !== field.id && (
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditName(field.name);
                        setEditingId(field.id);
                      }}
                      className="text-slate-500 hover:text-cyan-400 p-1 rounded-lg hover:bg-white/10"
                      title="Edit field name"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteField(field.id);
                      }}
                      className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10"
                      title="Delete field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FieldSidebar;
