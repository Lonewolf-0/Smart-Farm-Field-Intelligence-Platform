import React, { useState } from "react";

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
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Save Field</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter a name for your drawn field boundary to save it.
        </p>
        
        {areaHectares !== undefined && areaHectares !== null && (
          <div className="mb-4 bg-green-50 text-green-800 p-3 rounded-lg text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12l5-5 5 5-5 5z" />
              <path d="M12 2l5 5-5 5-5-5z" />
              <path d="M12 22l5-5-5 5-5 5z" />
              <path d="M22 12l-5 5-5-5 5-5z" />
            </svg>
            <span>
              <strong>Area:</strong> {areaHectares.toFixed(2)} ha / {(areaHectares * 2.47105).toFixed(2)} acres
            </span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="fieldName" className="block text-sm font-medium text-gray-700 mb-1">
              Field Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fieldName"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fieldName.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving...
                </>
              ) : (
                "Save Field"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveFieldModal;
