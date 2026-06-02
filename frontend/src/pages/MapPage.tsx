import { useState } from "react";
import FarmMap from "../components/Map/FarmMap";
import type { DrawnPolygon } from "../components/Map/FarmMap";

const MapPage: React.FC = () => {
  const [currentPolygon, setCurrentPolygon] = useState<DrawnPolygon | null>(null);

  const handlePolygonChange = (polygon: DrawnPolygon | null) => {
    setCurrentPolygon(polygon);
    if (polygon) {
      console.log("Polygon drawn:", polygon.geoJSON);
    } else {
      console.log("Polygon cleared");
    }
  };

  return (
    <div className="w-full h-full relative">
      <FarmMap onPolygonChange={handlePolygonChange} />
      
      {/* Debug panel */}
      {currentPolygon && (
        <div className="absolute top-20 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-xs pointer-events-none">
          <h3 className="font-bold text-sm mb-2 text-gray-800">Polygon Data</h3>
          <p className="text-xs text-gray-600">
            Vertices: {currentPolygon.geoJSON.coordinates[0].length - 1}
          </p>
        </div>
      )}
    </div>
  );
};

export default MapPage;
