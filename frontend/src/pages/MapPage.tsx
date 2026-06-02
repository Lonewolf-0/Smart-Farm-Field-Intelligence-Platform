import { useState } from "react";
import FarmMap from "../components/Map/FarmMap";
import type { DrawnPolygon } from "../components/Map/FarmMap";

const MapPage: React.FC = () => {
  const [currentPolygon, setCurrentPolygon] = useState<DrawnPolygon | null>(
    null,
  );

  const handlePolygonChange = (polygon: DrawnPolygon | null) => {
    setCurrentPolygon(polygon);

    if (polygon) {
      console.log("Polygon drawn:", {
        coordinates: polygon.geoJSON.coordinates,
        area: `${polygon.area.toFixed(2)} hectares`,
      });
    } else {
      console.log("Polygon cleared");
    }
  };

  return (
    <div className="w-full h-full">
      <FarmMap onPolygonChange={handlePolygonChange} />

      {/* Debug panel (remove in production) */}
      {currentPolygon && (
        <div className="absolute top-20 right-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="font-bold text-sm mb-2 text-gray-800">Polygon Data</h3>
          <p className="text-xs text-gray-600">
            Area: {currentPolygon.area.toFixed(2)} ha
          </p>
          <p className="text-xs text-gray-600">
            Vertices: {currentPolygon.geoJSON.coordinates[0].length - 1}
          </p>
          <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(
              currentPolygon.geoJSON.coordinates[0].slice(0, 3),
              null,
              2,
            )}
            {currentPolygon.geoJSON.coordinates[0].length > 3 && "\n..."}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MapPage;
