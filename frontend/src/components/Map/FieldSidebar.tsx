import React from "react";
import type { Field } from "../../types";

interface FieldSidebarProps {
  fields: Field[];
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  isLoading: boolean;
}

const FieldSidebar: React.FC<FieldSidebarProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  isLoading,
}) => {
  return (
    <div className="w-80 h-full border-r bg-white flex flex-col z-[1000] shadow-xl relative overflow-hidden shrink-0">
      <div className="p-4 border-b bg-green-50">
        <h2 className="text-lg font-bold text-gray-800">My Fields</h2>
        <p className="text-sm text-gray-600">Saved boundaries</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <span className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full"></span>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-4">
            <p className="text-gray-500 text-sm">
              No fields saved yet. Draw a polygon on the map and click "Save Polygon".
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {fields.map((field) => (
              <li key={field.id}>
                <button
                  onClick={() => onSelectField(field.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all border ${
                    selectedFieldId === field.id
                      ? "bg-green-50 border-green-500 shadow-sm"
                      : "bg-white border-gray-200 hover:border-green-300 hover:bg-gray-50"
                  }`}
                >
                  <h3 className="font-semibold text-gray-800 truncate">
                    {field.name}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 mt-2 gap-3">
                    <span className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12l5-5 5 5-5 5z" />
                        <path d="M12 2l5 5-5 5-5-5z" />
                        <path d="M12 22l5-5-5 5-5 5z" />
                        <path d="M22 12l-5 5-5-5 5-5z" />
                      </svg>
                      {field.area.toFixed(2)} ha
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FieldSidebar;
