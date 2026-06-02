import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, ZoomControl, useMap } from "react-leaflet";
import type { LatLngExpression, Map as LeafletMap } from "leaflet";
import L from "leaflet";
import DrawControls from "./DrawControls";
import DrawButton from "./DrawButton";
import AreaDisplay from "./AreaDisplay";

// Default center: India
const INDIA_CENTER: LatLngExpression = [20.5937, 78.9629];
const DEFAULT_ZOOM = 15;
const FALLBACK_ZOOM = 5;

// Component to fly to location
interface FlyToLocationProps {
  center: LatLngExpression;
  zoom: number;
}

const FlyToLocation: React.FC<FlyToLocationProps> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);

  return null;
};

// Exported polygon data type
export interface DrawnPolygon {
  geoJSON: GeoJSON.Polygon;
  area: number; // hectares
}

interface FarmMapProps {
  onPolygonChange?: (polygon: DrawnPolygon | null) => void;
}

const FarmMap: React.FC<FarmMapProps> = ({ onPolygonChange }) => {
  const hasGeolocation =
    typeof navigator !== "undefined" && !!navigator.geolocation;

  // Location state
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(
    null,
  );
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(INDIA_CENTER);
  const [zoom, setZoom] = useState<number>(FALLBACK_ZOOM);
  const [locationStatus, setLocationStatus] = useState<
    "loading" | "granted" | "denied" | "unavailable"
  >(hasGeolocation ? "loading" : "unavailable");

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<DrawnPolygon | null>(null);

  const mapRef = useRef<LeafletMap | null>(null);

  // Geolocation
  useEffect(() => {
    if (!hasGeolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LatLngExpression = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserLocation(location);
        setMapCenter(location);
        setZoom(DEFAULT_ZOOM);
        setLocationStatus("granted");
      },
      () => {
        setMapCenter(INDIA_CENTER);
        setZoom(FALLBACK_ZOOM);
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, [hasGeolocation]);

  // Handle polygon created
  const handlePolygonCreated = useCallback(
    (geoJSON: GeoJSON.Polygon, area: number) => {
      const polygon: DrawnPolygon = { geoJSON, area };
      setDrawnPolygon(polygon);
      onPolygonChange?.(polygon);
    },
    [onPolygonChange],
  );

  // Handle polygon deleted
  const handlePolygonDeleted = useCallback(() => {
    setDrawnPolygon(null);
    onPolygonChange?.(null);
  }, [onPolygonChange]);

  // Start drawing programmatically
  const handleStartDraw = () => {
    setIsDrawing(true);
  };

  // Cancel drawing
  const handleCancelDraw = () => {
    setIsDrawing(false);
    // The draw handler will be disabled via the DrawControls component
  };

  // Clear existing polygon
  const handleClearPolygon = () => {
    setDrawnPolygon(null);
    onPolygonChange?.(null);
    // Remove all polygon layers and markers (non-tile, non-zoom layers)
    if (mapRef.current) {
      mapRef.current.eachLayer((layer: L.Layer) => {
        if (
          layer instanceof L.Polygon ||
          layer instanceof L.Polyline ||
          layer instanceof L.Marker
        ) {
          layer.remove();
        }
      });
    }
  };

  // Recenter on user location
  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo(userLocation, DEFAULT_ZOOM, { duration: 1.5 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)]">
      {/* Location Status Banner */}
      {locationStatus === "loading" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full"></span>
          <span className="text-sm text-gray-700">
            Detecting your location...
          </span>
        </div>
      )}

      {locationStatus === "denied" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg shadow-md">
          <span className="text-sm text-yellow-700">
            📍 Location access denied. Showing default view.
          </span>
        </div>
      )}

      {/* Custom Draw Button */}
      <DrawButton
        isDrawing={isDrawing}
        hasPolygon={drawnPolygon !== null}
        onStartDraw={handleStartDraw}
        onCancelDraw={handleCancelDraw}
        onClearPolygon={handleClearPolygon}
      />

      {/* Area Display */}
      {drawnPolygon && <AreaDisplay area={drawnPolygon.area} />}

      {/* Recenter Button */}
      {userLocation && locationStatus === "granted" && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-6 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          title="Center on my location"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        dragging={true}
        className="w-full h-full z-0"
        ref={mapRef}
      >
        {/* Satellite Tiles */}
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        {/* Labels Overlay */}
        <TileLayer
          attribution=""
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          opacity={0.8}
        />

        {/* Zoom Controls */}
        <ZoomControl position="topright" />

        {/* Fly to user location */}
        {locationStatus === "granted" && userLocation && (
          <FlyToLocation center={userLocation} zoom={DEFAULT_ZOOM} />
        )}

        {/* Drawing Controls */}
        <DrawControls
          onPolygonCreated={handlePolygonCreated}
          onPolygonDeleted={handlePolygonDeleted}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
        />
      </MapContainer>
    </div>
  );
};

export default FarmMap;
