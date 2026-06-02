import { useState } from "react";
import FarmMap from "../components/Map/FarmMap";
import type { DrawnPolygon } from "../components/Map/FarmMap";
import { useAuth } from "../context/AuthContext";
import SaveFieldModal from "../components/Map/SaveFieldModal";
import api from "../services/api";

const MapPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPolygon, setCurrentPolygon] = useState<DrawnPolygon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handlePolygonChange = (polygon: DrawnPolygon | null) => {
    setCurrentPolygon(polygon);
    setSaveSuccess(null);
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
    } catch (error) {
      console.error("Failed to save field:", error);
      alert("Failed to save field. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full relative">
      <FarmMap onPolygonChange={handlePolygonChange} />
      
      {/* Save Button for authenticated users */}
      {currentPolygon && isAuthenticated && !saveSuccess && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute top-20 right-4 z-[1000] bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors font-medium"
        >
          Save Polygon
        </button>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="absolute top-20 right-4 z-[1000] bg-white border-l-4 border-green-500 p-4 rounded shadow-lg max-w-xs">
          <p className="text-sm text-green-700 font-medium">{saveSuccess}</p>
        </div>
      )}

      {/* Debug panel (fallback or additional info) */}
      {currentPolygon && !saveSuccess && (
        <div className="absolute top-36 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-xs pointer-events-none">
          <h3 className="font-bold text-sm mb-2 text-gray-800">Polygon Data</h3>
          <p className="text-xs text-gray-600">
            Vertices: {currentPolygon.geoJSON.coordinates[0].length - 1}
          </p>
        </div>
      )}

      <SaveFieldModal
        isOpen={isModalOpen}
        isLoading={isSaving}
        onSave={handleSaveSubmit}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default MapPage;
