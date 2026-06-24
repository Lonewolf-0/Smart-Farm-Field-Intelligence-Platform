import { useState, useEffect } from "react";
import { Save, CheckCircle, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import FarmMap from "../components/Map/FarmMap";
import type { DrawnPolygon } from "../components/Map/FarmMap";
import { useAuth } from "../context/AuthContext";
import { useField } from "../context/FieldContext";
import SaveFieldModal from "../components/Map/SaveFieldModal";
import FieldSidebar from "../components/Map/FieldSidebar";
import api from "../services/api";
import * as turf from "@turf/turf";

const MapPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPolygon, setCurrentPolygon] = useState<DrawnPolygon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile: collapsed by default

  const { fields: savedFields, isLoadingFields, selectedFieldId, setSelectedFieldId, refreshFields } = useField();
  
  const [currentAreaHa, setCurrentAreaHa] = useState<number | null>(null);

  // On desktop view, auto-open sidebar
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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
    <div className="w-full h-[calc(100vh-5rem)] sm:h-[calc(100vh-8rem)] flex overflow-hidden">
      <div className="w-full h-full flex rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-2 sm:p-4 lg:p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl overflow-hidden gap-2 sm:gap-4 lg:gap-6">

        {/* Sidebar — slide-in panel on mobile/tablet, inline on desktop */}
        {isAuthenticated && (
          <>
            {/* Mobile backdrop */}
            {sidebarOpen && (
              <div
                className="lg:hidden fixed inset-0 bg-black/40 z-[1005]"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar drawer container */}
            <div
              className={[
                "shrink-0 transition-all duration-300 ease-in-out overflow-hidden rounded-2xl border border-white/10 bg-black/20",
                "fixed left-0 top-16 bottom-0 z-[1010] lg:static lg:z-auto",
                sidebarOpen ? "w-72 sm:w-80 lg:w-auto" : "w-0 border-0",
              ].join(" ")}
            >
              <div className="h-full overflow-y-auto">
                <FieldSidebar
                  fields={savedFields}
                  isLoading={isLoadingFields}
                  selectedFieldId={selectedFieldId}
                  onSelectField={(id) => {
                    handleSelectField(id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  onDeleteField={handleDeleteField}
                  onEditField={handleEditField}
                />
              </div>
            </div>
          </>
        )}

        {/* Map Area */}
        <div className="flex-1 h-full relative z-0 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10">
          <FarmMap 
            onPolygonChange={handlePolygonChange}
            savedFields={savedFields}
            selectedFieldId={selectedFieldId}
            onSelectField={handleSelectField}
          />
          
          {/* Mobile toggle button */}
          {isAuthenticated && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/20 text-white p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium min-h-[44px]"
              aria-label="Toggle field sidebar"
            >
              <Layers className="h-4 w-4 text-emerald-400" />
              <span className="text-xs">Fields</span>
              {sidebarOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Save Button */}
          {currentPolygon && isAuthenticated && !saveSuccess && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-500 text-slate-950 px-5 py-3 rounded-full shadow-2xl hover:bg-emerald-400 transition-transform hover:scale-105 font-bold flex items-center gap-2 text-sm"
            >
              <Save className="h-4 w-4" /> Save Polygon
            </button>
          )}

          {/* Field Info Panel */}
          {currentPolygon && !saveSuccess && (
            <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 sm:px-6 py-3 rounded-2xl shadow-xl max-w-xs w-[calc(100%-2rem)] sm:w-auto pointer-events-none flex flex-col items-center">
              <h3 className="font-bold text-sm mb-1 text-white">Drawn Field Data</h3>
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <p>Vertices: <span className="text-white font-medium">{currentPolygon.geoJSON.coordinates[0].length - 1}</span></p>
                {currentAreaHa !== null && (
                  <p>Area: <span className="text-white font-medium">{currentAreaHa.toFixed(2)} ha</span></p>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-xl shadow-lg max-w-xs w-[calc(100%-2rem)] sm:w-auto flex items-center gap-2">
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
