import React from "react";
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
              <li key={field.id} className="relative group">
                <button
                  onClick={() => {
                    if (editingId !== field.id) onSelectField(field.id);
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-all border ${
                    selectedFieldId === field.id
                      ? "bg-green-50 border-green-500 shadow-sm"
                      : "bg-white border-gray-200 hover:border-green-300 hover:bg-gray-50"
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
                          className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-green-500"
                          autoFocus
                        />
                        <button 
                          type="submit"
                          className="text-green-600 hover:text-green-700 bg-green-50 p-1 rounded"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button 
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:text-gray-700 bg-gray-100 p-1 rounded"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </form>
                    ) : (
                      <h3 className="font-semibold text-gray-800 truncate">
                        {field.name}
                      </h3>
                    )}
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
                      className="text-gray-400 hover:text-blue-500 p-1 rounded-md hover:bg-blue-50"
                      title="Edit field name"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteField(field.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50"
                      title="Delete field"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
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
