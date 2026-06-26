import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { NutrienBranch, Field } from "../../types";

interface BranchMapProps {
  branches: (NutrienBranch & { distance?: number })[];
  savedFields: Field[];
  selectedBranchId: string | null;
  selectedFieldId?: string;
  onSelectBranch: (id: string) => void;
}

const DEFAULT_CENTER: L.LatLngExpression = [53.5461, -113.4938]; // Edmonton as fallback
const DEFAULT_ZOOM = 5;

// Component to fly to the selected branch
const MapEffect: React.FC<{
  selectedBranchId: string | null;
  branches: NutrienBranch[];
}> = ({ selectedBranchId, branches }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedBranchId) {
      const branch = branches.find((b) => b.id === selectedBranchId);
      if (branch) {
        map.flyTo([branch.latitude, branch.longitude], 13, { duration: 1.5 });
      }
    }
  }, [selectedBranchId, branches, map]);

  return null;
};

// Create custom icons
const branchIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const branchSelectedIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
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

const BranchMap: React.FC<BranchMapProps> = ({
  branches,
  savedFields,
  selectedBranchId,
  selectedFieldId,
  onSelectBranch,
}) => {
  const selectedField = savedFields.find((f) => f.id === selectedFieldId);

  // Center map on the first field if available, else fallback
  const initialCenter =
    selectedField && selectedField.centroid
      ? ([selectedField.centroid.lat, selectedField.centroid.lng] as L.LatLngExpression)
      : savedFields.length > 0
      ? ([savedFields[0].centroid.lat, savedFields[0].centroid.lng] as L.LatLngExpression)
      : DEFAULT_CENTER;

  return (
    <div className="h-full w-full relative bg-slate-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full z-0"
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        />
        
        {/* Render User Fields */}
        {savedFields.map((field) => (
          <GeoJSON
            key={field.id}
            data={field.polygon}
            style={{
              color: "#3b82f6", // Blue for user fields
              weight: 3,
              fillColor: "#3b82f6",
              fillOpacity: 0.2,
            }}
          />
        ))}

        {/* Render Selected Farm Pointer */}
        {selectedField && selectedField.centroid && (
          <Marker
            position={[selectedField.centroid.lat, selectedField.centroid.lng]}
            icon={farmIcon}
          >
            <Popup className="rounded-xl">
              <div className="p-1 text-center bg-slate-900 text-white rounded-lg">
                <h3 className="font-bold text-lg text-white mb-1">{selectedField.name}</h3>
                <p className="text-xs text-emerald-400 uppercase font-semibold">Your Farm</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Branches */}
        {branches.map((branch) => (
          <Marker
            key={branch.id}
            position={[branch.latitude, branch.longitude]}
            icon={branch.id === selectedBranchId ? branchSelectedIcon : branchIcon}
            eventHandlers={{
              click: () => onSelectBranch(branch.id),
            }}
          >
            <Popup className="rounded-xl">
              <div className="p-1 min-w-[200px] bg-slate-900 text-slate-100 rounded-lg">
                <h3 className="font-bold text-lg text-white mb-1">{branch.name}</h3>
                <p className="text-sm text-slate-300 mb-3">{branch.address}</p>
                
                {branch.distance !== undefined && (
                  <p className="text-sm text-slate-300 mb-2 font-medium">
                    Distance: <span className="text-emerald-400 font-semibold">{(branch.distance * 0.621371).toFixed(1)} miles</span>
                  </p>
                )}
                
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase mb-1">Services</h4>
                  <div className="flex flex-wrap gap-1">
                    {branch.services.slice(0, 3).map((service, i) => (
                      <span key={i} className="text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-full border border-white/5">
                        {service}
                      </span>
                    ))}
                    {branch.services.length > 3 && (
                      <span className="text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-full border border-white/5">
                        +{branch.services.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1${selectedField && selectedField.centroid ? `&origin=${selectedField.centroid.lat},${selectedField.centroid.lng}` : ""}&destination=${branch.latitude},${branch.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapEffect selectedBranchId={selectedBranchId} branches={branches} />
      </MapContainer>
    </div>
  );
};

export default BranchMap;
