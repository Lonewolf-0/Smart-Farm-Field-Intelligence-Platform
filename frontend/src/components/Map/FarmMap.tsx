import { useEffect, useState } from "react";
import { Crosshair } from "lucide-react";
import { MapContainer, TileLayer, ZoomControl, useMap, GeoJSON, Tooltip } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import GeomanControl from "./GeomanControl";

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

export interface DrawnPolygon {
  geoJSON: GeoJSON.Polygon;
}

interface FarmMapProps {
  onPolygonChange?: (polygon: DrawnPolygon | null) => void;
  savedFields?: any[]; // using any to avoid import cycles if not needed, or better use Field type
  selectedFieldId?: string | null;
  onSelectField?: (id: string) => void;
}

const FarmMap: React.FC<FarmMapProps> = ({ 
  onPolygonChange,
  savedFields = [],
  selectedFieldId = null,
  onSelectField
}) => {
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

  const handlePolygonCreated = (geoJSON: GeoJSON.Polygon) => {
    onPolygonChange?.({ geoJSON });
  };

  const handlePolygonDeleted = () => {
    onPolygonChange?.(null);
  };

  // Fly to selected field when it changes
  useEffect(() => {
    if (selectedFieldId && savedFields.length > 0) {
      const field = savedFields.find((f) => f.id === selectedFieldId);
      if (field && field.centroid) {
        setMapCenter([field.centroid.lat, field.centroid.lng]);
        setZoom(16);
      }
    }
  }, [selectedFieldId, savedFields]);

  // Recenter on user location
  const handleRecenter = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setZoom(DEFAULT_ZOOM);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)]">
      {/* Location Status Banner */}
      {locationStatus === "loading" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full"></span>
          <span className="text-sm text-slate-300">
            Detecting your location...
          </span>
        </div>
      )}

      {locationStatus === "denied" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl shadow-md">
          <span className="text-sm text-amber-200">
            📍 Location access denied. Showing default view.
          </span>
        </div>
      )}

      {/* Recenter Button */}
      {userLocation && locationStatus === "granted" && (
        <button
          onClick={handleRecenter}
          className="absolute bottom-6 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-full shadow-lg hover:bg-slate-800 transition-colors"
          title="Center on my location"
        >
          <Crosshair className="h-5 w-5 text-emerald-400" />
        </button>
      )}

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        dragging={true}
        className="w-full h-full z-0"
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
          <FlyToLocation center={mapCenter} zoom={zoom} />
        )}

        {/* Saved Polygons */}
        {savedFields.map((field) => {
          const isSelected = field.id === selectedFieldId;
          return (
            <GeoJSON
              key={field.id}
              data={field.polygon}
              eventHandlers={{
                click: () => onSelectField?.(field.id),
              }}
              pathOptions={{
                color: isSelected ? "#eab308" : "#3b82f6", // Yellow if selected, blue otherwise
                weight: isSelected ? 4 : 2,
                fillColor: isSelected ? "#fef08a" : "#93c5fd",
                fillOpacity: isSelected ? 0.6 : 0.3,
              }}
            >
              <Tooltip direction="top" sticky>
                <span className="font-semibold">{field.name}</span>
              </Tooltip>
            </GeoJSON>
          );
        })}

        <GeomanControl
          onPolygonCreated={handlePolygonCreated}
          onPolygonDeleted={handlePolygonDeleted}
        />
      </MapContainer>
    </div>
  );
};

export default FarmMap;
