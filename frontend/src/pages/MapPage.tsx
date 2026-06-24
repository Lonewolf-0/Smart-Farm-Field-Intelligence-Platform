import { useState, useEffect, useCallback } from "react";
import { Save, CheckCircle } from "lucide-react";
import FarmMap from "../components/Map/FarmMap";
import type { DrawnPolygon } from "../components/Map/FarmMap";
import { useAuth } from "../context/AuthContext";
import { useField } from "../context/FieldContext";
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

  const { fields: savedFields, isLoadingFields, selectedFieldId, setSelectedFieldId, refreshFields } = useField();
  
  const [currentAreaHa, setCurrentAreaHa] = useState<number | null>(null);

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
      void refreshFields();
    } catch (error) {
      console.error("Failed to save field:", error);
      alert("Failed to save field. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectField = (id: string) => {
    setSelectedFieldId(selectedFieldId === id ? null : id);
  };

  const handleDeleteField = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this field?")) return;
    
    try {
      await api.delete(`/fields/${id}`);
      if (selectedFieldId === id) {
        setSelectedFieldId(null);
      }
      void refreshFields();
    } catch (error) {
      console.error("Failed to delete field:", error);
      alert("Failed to delete field. Please try again.");
    }
  };

  const handleEditField = async (id: string, newName: string) => {
    try {
      await api.put(`/fields/${id}`, { name: newName });
      void refreshFields();
    } catch (error) {
      console.error("Failed to rename field:", error);
      alert("Failed to rename field. Please try again.");
    }
  };

  return (
    <div className="w-full h-[calc(100vh-8rem)] flex overflow-hidden">
      <div className="w-full h-full flex rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl overflow-hidden gap-6">
        {/* Sidebar */}
      {isAuthenticated && (
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 shrink-0">
          <FieldSidebar
            fields={savedFields}
            isLoading={isLoadingFields}
            selectedFieldId={selectedFieldId}
            onSelectField={handleSelectField}
            onDeleteField={handleDeleteField}
            onEditField={handleEditField}
          />
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 h-full relative z-0 rounded-2xl overflow-hidden border border-white/10">
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
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-500 text-slate-950 px-6 py-3 rounded-full shadow-2xl hover:bg-emerald-400 transition-transform hover:scale-105 font-bold flex items-center gap-2"
          >
            <Save className="h-5 w-5" /> Save Polygon
          </button>
        )}

        {/* Debug panel (fallback or additional info) */}
        {currentPolygon && !saveSuccess && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl shadow-xl max-w-sm pointer-events-none flex flex-col items-center">
            <h3 className="font-bold text-sm mb-1 text-white">Drawn Field Data</h3>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <p>Vertices: <span className="text-white font-medium">{currentPolygon.geoJSON.coordinates[0].length - 1}</span></p>
              {currentAreaHa !== null && (
                <p>Area: <span className="text-white font-medium">{currentAreaHa.toFixed(2)} ha / {(currentAreaHa * 2.47105).toFixed(2)} acres</span></p>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-xl shadow-lg max-w-xs flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-200 font-medium">{saveSuccess}</p>
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
    </div>
  );
};

export default MapPage;
