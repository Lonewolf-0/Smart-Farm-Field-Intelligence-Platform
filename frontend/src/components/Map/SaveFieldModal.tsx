import React, { useState } from "react";
import { Save, AlertTriangle } from "lucide-react";

interface SaveFieldModalProps {
  onSave: (name: string) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  isLoading: boolean;
  areaAcres?: number | null;
  error?: string | null;
}

const SaveFieldModal: React.FC<SaveFieldModalProps> = ({
  onSave,
  onCancel,
  isOpen,
  isLoading,
  areaAcres,
  error,
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
        
        {areaAcres !== undefined && areaAcres !== null && (
          <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 mb-6">
            <p className="text-sm text-slate-300 flex items-center justify-between">
              <strong>Area:</strong> {areaAcres.toFixed(2)} acres
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="fieldName" className="block text-sm font-medium text-slate-300 mb-1">
              Field Name <span className="text-red-400">*</span>
            </label>
            {error && (
              <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-200 text-xs font-semibold animate-slide-up">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
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
