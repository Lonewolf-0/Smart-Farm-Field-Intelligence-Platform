import React, { useState } from "react";
import { Save, Maximize2 } from "lucide-react";

interface SaveFieldModalProps {
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  isLoading: boolean;
  areaHectares?: number | null;
}

const SaveFieldModal: React.FC<SaveFieldModalProps> = ({
  onSave,
  onCancel,
  isOpen,
  isLoading,
  areaHectares,
}) => {
  const [fieldName, setFieldName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fieldName.trim()) {
      onSave(fieldName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all">
        <h2 className="text-xl font-bold text-white mb-4">Save Field</h2>
        <p className="text-sm text-slate-400 mb-4">
          Enter a name for your drawn field boundary to save it.
        </p>
        
        {areaHectares !== undefined && areaHectares !== null && (
          <div className="mb-4 bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 p-3 rounded-xl text-sm flex items-center gap-2">
            <Maximize2 className="h-5 w-5" />
            <span>
              <strong>Area:</strong> {areaHectares.toFixed(2)} ha / {(areaHectares * 2.47105).toFixed(2)} acres
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="fieldName" className="block text-sm font-medium text-slate-300 mb-1">
              Field Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="fieldName"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:outline-none transition-colors"
              placeholder="e.g. North Pasture"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fieldName.trim() || isLoading}
              className="px-4 py-2.5 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving...
                </>
              ) : (
                <><Save className="h-4 w-4" /> Save Field</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveFieldModal;
