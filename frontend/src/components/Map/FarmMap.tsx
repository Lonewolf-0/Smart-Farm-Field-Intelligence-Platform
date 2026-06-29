import React, { useEffect, useState, useRef } from "react";
import { Crosshair, Search, MapPin, X, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, useMap, GeoJSON, Tooltip, Marker } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
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

const formatPhotonName = (feature: any): string => {
  if (!feature || !feature.properties) return "";
  const { name, street, city, state, country } = feature.properties;
  const parts: string[] = [];
  if (name) parts.push(name);
  if (street && street !== name) parts.push(street);
  if (city && city !== name) parts.push(city);
  if (state && state !== name && state !== city) parts.push(state);
  if (country && country !== name) parts.push(country);
  return parts.length > 0 ? parts.join(", ") : "Unknown Location";
};

const customMarkerIcon = L.divIcon({
  className: "custom-marker-icon",
  html: `
    <div style="display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#10b981" width="36" height="36" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const branchIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const farmIcon = new L.DivIcon({
  className: "custom-farm-icon",
  html: `<div style="background-color: #3b82f6; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); margin-top: -8px; margin-left: -8px;">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
             <polyline points="9 22 9 12 15 12 15 22"></polyline>
           </svg>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20]
});

export interface DrawnPolygon {
  geoJSON: GeoJSON.Polygon;
}

interface FarmMapProps {
  onPolygonChange?: (polygon: DrawnPolygon | null) => void;
  savedFields?: any[]; // using any to avoid import cycles if not needed, or better use Field type
  selectedFieldId?: string | null;
  onSelectField?: (id: string) => void;
  readOnly?: boolean;
  branches?: any[];
  showFieldMarkers?: boolean;
}

const FarmMap: React.FC<FarmMapProps> = ({
  onPolygonChange,
  savedFields = [],
  selectedFieldId = null,
  onSelectField,
  readOnly = false,
  branches = [],
  showFieldMarkers = false
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<LatLngExpression | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const skipSearchRef = useRef(false);

  // Reset suggestions list selection index when results change
  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [searchResults]);

  // Scroll active suggestion into view within the dropdown container
  useEffect(() => {
    if (activeSuggestionIndex >= 0) {
      const activeEl = document.getElementById(`suggestion-${activeSuggestionIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeSuggestionIndex]);

  // Debounced geocoding search as the user types
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        let biasParams = "";
        if (Array.isArray(mapCenter)) {
          biasParams = `&lat=${mapCenter[0]}&lon=${mapCenter[1]}`;
        } else if (mapCenter && typeof mapCenter === "object" && "lat" in mapCenter && "lng" in mapCenter) {
          biasParams = `&lat=${mapCenter.lat}&lon=${(mapCenter as any).lng}`;
        }

        const response = await fetch(
          `https://photon.komoot.io/api?q=${encodeURIComponent(
            searchQuery
          )}&limit=25${biasParams}`
        );
        if (!response.ok) {
          throw new Error("Search failed");
        }
        const data = await response.json();
        setSearchResults(data.features || []);
        if (!data.features || data.features.length === 0) {
          setSearchError("No locations found");
        }
      } catch (err) {
        console.error("Geocoding autocomplete failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    skipSearchRef.current = true;
    setIsSearching(true);
    setSearchError(null);
    try {
      let biasParams = "";
      if (Array.isArray(mapCenter)) {
        biasParams = `&lat=${mapCenter[0]}&lon=${mapCenter[1]}`;
      } else if (mapCenter && typeof mapCenter === "object" && "lat" in mapCenter && "lng" in mapCenter) {
        biasParams = `&lat=${mapCenter.lat}&lon=${(mapCenter as any).lng}`;
      }

      const response = await fetch(
        `https://photon.komoot.io/api?q=${encodeURIComponent(
          searchQuery
        )}&limit=25${biasParams}`
      );
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = await response.json();
      const features = data.features || [];
      if (features.length > 0) {
        const topResult = features[0];
        const [lon, lat] = topResult.geometry.coordinates;
        setMapCenter([lat, lon]);
        setZoom(18);
        setSearchedLocation([lat, lon]);
        setSearchQuery(formatPhotonName(topResult));
        setSearchResults([]); // Hide the suggestions dropdown immediately
      } else {
        setSearchError("No locations found");
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Geocoding search failed:", err);
      setSearchError("Failed to fetch location search results.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    skipSearchRef.current = true;
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setSearchedLocation(null);
  };

  const handleSelectResult = (result: any) => {
    const [lon, lat] = result.geometry.coordinates;
    setMapCenter([lat, lon]);
    setZoom(18);
    setSearchedLocation([lat, lon]);
    skipSearchRef.current = true;
    setSearchQuery(formatPhotonName(result));
    setSearchResults([]);
    setSearchError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Enter") {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < searchResults.length) {
        e.preventDefault();
        handleSelectResult(searchResults[activeSuggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setSearchResults([]);
      setSearchError(null);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)]">
      {/* Location Status Banner */}
      {!readOnly && locationStatus === "loading" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl shadow-md flex items-center gap-2">
          <span className="animate-spin h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full"></span>
          <span className="text-sm text-slate-300">
            Detecting your location...
          </span>
        </div>
      )}

      {!readOnly && locationStatus === "denied" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl shadow-md">
          <span className="text-sm text-amber-200">
            📍 Location access denied. Showing default view.
          </span>
        </div>
      )}

      {/* Search Location Bar */}
      {!readOnly && (
      <div className="absolute top-4 right-4 z-[1000] w-72 sm:w-80">
        <form onSubmit={handleSearch} className="flex items-center bg-slate-950/80 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md transition-all focus-within:border-emerald-500/50 overflow-hidden">
          <div className="pl-3.5 text-slate-400 shrink-0">
            <Search className="h-4 w-4" />
          </div>
          <div className="flex-1 flex items-center min-w-0 relative">
            <input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchError) setSearchError(null);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm pl-2.5 pr-8 py-3 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-bold px-4 py-3 shrink-0 h-full transition-colors flex items-center justify-center min-w-[70px] self-stretch cursor-pointer"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {(searchResults.length > 0 || searchError) && (
          <div className="mt-2 bg-slate-950/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden divide-y divide-white/5 backdrop-blur-md max-h-[400px] overflow-y-auto">
            {searchError && (
              <div className="px-4 py-3 text-xs text-amber-400/90 text-center">
                {searchError}
              </div>
            )}
             {searchResults.map((result, index) => {
              const isActive = index === activeSuggestionIndex;
              return (
                <button
                  key={result.properties.osm_id || Math.random()}
                  id={`suggestion-${index}`}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className={`w-full text-left px-4 py-3 text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                    isActive 
                      ? "bg-emerald-500 text-slate-950 font-bold" 
                      : "text-slate-300 hover:bg-emerald-500 hover:text-slate-950"
                  }`}
                >
                  <MapPin className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? "opacity-100" : "opacity-70"}`} />
                  <span className="leading-relaxed">{formatPhotonName(result)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Recenter Button */}
      {!readOnly && userLocation && locationStatus === "granted" && (
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



        {/* Fly to location */}
        <FlyToLocation center={mapCenter} zoom={zoom} />

        {/* Searched Location Marker */}
        {searchedLocation && (
          <Marker
            position={searchedLocation}
            icon={customMarkerIcon}
            eventHandlers={{
              click: () => {
                setZoom(18);
                setMapCenter(searchedLocation);
              },
            }}
          />
        )}

        {/* Saved Polygons */}
        {savedFields.map((field) => {
          const isSelected = field.id === selectedFieldId;
          return (
            <React.Fragment key={field.id}>
              <GeoJSON
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
              {showFieldMarkers && field.centroid && (
                <Marker position={[field.centroid.lat, field.centroid.lng]} icon={farmIcon} />
              )}
            </React.Fragment>
          );
        })}
        {branches.map((branch) => (
          <Marker
            key={branch.id}
            position={[branch.latitude, branch.longitude]}
            icon={branchIcon}
          >
            <Tooltip direction="top" sticky>
              <span className="font-semibold">{branch.name}</span>
            </Tooltip>
          </Marker>
        ))}

        {!readOnly && (
          <GeomanControl
            onPolygonCreated={handlePolygonCreated}
            onPolygonDeleted={handlePolygonDeleted}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default FarmMap;
