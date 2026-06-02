import { useState, useEffect, useCallback } from "react";
import FarmMap from "../components/Map/FarmMap";
import type { DrawnPolygon } from "../components/Map/FarmMap";
import { useAuth } from "../context/AuthContext";
import SaveFieldModal from "../components/Map/SaveFieldModal";
import FieldSidebar from "../components/Map/FieldSidebar";
import api from "../services/api";
import type { Field } from "../types";
import * as turf from "@turf/turf";

const MapPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPolygon, setCurrentPolygon] = useState<DrawnPolygon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [savedFields, setSavedFields] = useState<Field[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [currentAreaHa, setCurrentAreaHa] = useState<number | null>(null);

  const fetchFields = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingFields(true);
      const res = await api.get("/fields");
      if (res.data?.success) {
        setSavedFields(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch fields:", err);
    } finally {
      setIsLoadingFields(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchFields();
  }, [fetchFields]);

  const handlePolygonChange = (polygon: DrawnPolygon | null) => {
    setCurrentPolygon(polygon);
    setSaveSuccess(null);
    if (polygon) {
      const areaSqMeters = turf.area(turf.polygon(polygon.geoJSON.coordinates));
      setCurrentAreaHa(areaSqMeters / 10000);
    } else {
      setCurrentAreaHa(null);
    }
  };

  const handleSaveSubmit = async (name: string) => {
    if (!currentPolygon) return;
    
    try {
      setIsSaving(true);
      await api.post("/fields", {
        name,
        polygon: currentPolygon.geoJSON,
      });
      setSaveSuccess(`Field "${name}" saved successfully!`);
      setIsModalOpen(false);
      void fetchFields(); // Refresh the list
    } catch (error) {
      console.error("Failed to save field:", error);
      alert("Failed to save field. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectField = (id: string) => {
    setSelectedFieldId((prev) => (prev === id ? null : id));
  };

  const handleDeleteField = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this field?")) return;
    
    try {
      await api.delete(`/fields/${id}`);
      if (selectedFieldId === id) {
        setSelectedFieldId(null);
      }
      void fetchFields();
    } catch (error) {
      console.error("Failed to delete field:", error);
      alert("Failed to delete field. Please try again.");
    }
  };

  const handleEditField = async (id: string, newName: string) => {
    try {
      await api.put(`/fields/${id}`, { name: newName });
      void fetchFields();
    } catch (error) {
      console.error("Failed to rename field:", error);
      alert("Failed to rename field. Please try again.");
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Sidebar */}
      {isAuthenticated && (
        <FieldSidebar
          fields={savedFields}
          isLoading={isLoadingFields}
          selectedFieldId={selectedFieldId}
          onSelectField={handleSelectField}
          onDeleteField={handleDeleteField}
          onEditField={handleEditField}
        />
      )}

      {/* Map Area */}
      <div className="flex-1 h-full relative z-0">
        <FarmMap 
          onPolygonChange={handlePolygonChange}
          savedFields={savedFields}
          selectedFieldId={selectedFieldId}
          onSelectField={handleSelectField}
        />
        
        {/* Save Button for authenticated users */}
        {currentPolygon && isAuthenticated && !saveSuccess && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-6 right-4 z-[1000] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors font-medium"
          >
            Save Polygon
          </button>
        )}

        {/* Debug panel (fallback or additional info) */}
        {currentPolygon && !saveSuccess && (
          <div className="absolute top-20 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-xs pointer-events-none">
            <h3 className="font-bold text-sm mb-2 text-gray-800">Drawn Field Data</h3>
            <p className="text-xs text-gray-600 mb-1">
              Vertices: {currentPolygon.geoJSON.coordinates[0].length - 1}
            </p>
            {currentAreaHa !== null && (
              <p className="text-xs text-gray-800 font-medium">
                Area: {currentAreaHa.toFixed(2)} ha / {(currentAreaHa * 2.47105).toFixed(2)} acres
              </p>
            )}
          </div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="absolute top-6 right-4 z-[1000] bg-white border-l-4 border-green-500 p-4 rounded shadow-lg max-w-xs">
            <p className="text-sm text-green-700 font-medium">{saveSuccess}</p>
          </div>
        )}

        <SaveFieldModal
          isOpen={isModalOpen}
          isLoading={isSaving}
          onSave={handleSaveSubmit}
          onCancel={() => setIsModalOpen(false)}
          areaHectares={currentAreaHa}
        />
      </div>
    </div>
  );
};

export default MapPage;
