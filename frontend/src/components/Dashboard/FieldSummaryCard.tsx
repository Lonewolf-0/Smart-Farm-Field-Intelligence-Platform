import React from "react";
import type { Field } from "../../types";
import { Map, ArrowRight } from "lucide-react";
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
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Map className="h-5 w-5 text-emerald-400" />
          Your Fields
        </h3>
        <Link to="/map" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
          View Map <ArrowRight className="h-4 w-4" />
        </Link>
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
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <Map className="h-4 w-4" />
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
