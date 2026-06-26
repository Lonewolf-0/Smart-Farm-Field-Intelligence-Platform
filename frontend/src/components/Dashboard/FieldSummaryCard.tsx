import React from "react";
import type { Field } from "../../types";
import { Map, Store } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  fields: Field[];
  onSelectField?: (id: string) => void;
  selectedFieldId?: string | null;
}

const FieldSummaryCard: React.FC<Props> = ({ fields, onSelectField, selectedFieldId }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">
          Your Fields
        </h3>
        <div className="flex items-center gap-2">
          <Link 
            to="/map" 
            className="group relative bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-white/5 hover:border-emerald-500/30"
          >
            <Map className="h-4 w-4" />
            <div className="absolute bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap text-white text-xs py-1.5 px-2.5 rounded-lg shadow-xl shadow-black/20 bg-slate-800 border border-white/10 font-semibold">
              View Map
            </div>
          </Link>
          <Link 
            to="/branches" 
            className="group relative bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-white/5 hover:border-emerald-500/30"
          >
            <Store className="h-4 w-4" />
            <div className="absolute bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap text-white text-xs py-1.5 px-2.5 rounded-lg shadow-xl shadow-black/20 bg-slate-800 border border-white/10 font-semibold">
              View Branches
            </div>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {fields.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-slate-400 mb-3">You don't have any fields yet.</p>
            <Link to="/map" className="text-sm font-semibold text-emerald-400 hover:underline">
              Add your first field
            </Link>
          </div>
        ) : (
          fields.map((field) => {
            const isSelected = field.id === selectedFieldId;
            return (
              <div 
                key={field.id} 
                onClick={() => onSelectField?.(field.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
                  isSelected 
                    ? "bg-emerald-500/20 border-emerald-500/50" 
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{field.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{(field.area * 2.47105).toFixed(2)} Acres</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FieldSummaryCard;
