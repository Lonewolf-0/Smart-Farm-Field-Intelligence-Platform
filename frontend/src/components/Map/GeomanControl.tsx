import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

interface GeomanControlProps {
  onPolygonCreated: (geoJSON: GeoJSON.Polygon) => void;
  onPolygonDeleted: () => void;
}

const GeomanControl: React.FC<GeomanControlProps> = ({
  onPolygonCreated,
  onPolygonDeleted,
}) => {
  const map = useMap();

  useEffect(() => {
    // Enable geoman controls
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    // Configure drawing style (semi-transparent green fill)
    map.pm.setPathOptions({
      color: "#22c55e",
      fillColor: "#22c55e",
      fillOpacity: 0.4,
    });

    // Custom cursor during drawing
    map.on("pm:drawstart", () => {
      document.querySelector(".leaflet-container")?.classList.add("cursor-crosshair");
    });
    map.on("pm:drawend", () => {
      document.querySelector(".leaflet-container")?.classList.remove("cursor-crosshair");
    });

    // Handle polygon creation
    const handleCreate = (e: any) => {
      const layer = e.layer;

      // Ensure only one polygon at a time by clearing previous polygons
      map.eachLayer((l: any) => {
        if (l instanceof L.Polygon && l !== layer && !l.options.interactive) {
          // Do not remove base map or other layers that are not geoman polygons
          // Actually, we can check if it has pm object
        }
        if (l.pm && l !== layer) {
          l.remove();
        }
      });

      // Extract GeoJSON and notify parent
      const geoJSON = layer.toGeoJSON().geometry as GeoJSON.Polygon;
      onPolygonCreated(geoJSON);

      // Handle edits on the new layer
      layer.on("pm:edit", () => {
        const updatedGeoJSON = layer.toGeoJSON().geometry as GeoJSON.Polygon;
        onPolygonCreated(updatedGeoJSON);
      });
    };

    map.on("pm:create", handleCreate);

    // Handle polygon deletion
    map.on("pm:remove", () => {
      // Just clear state
      onPolygonDeleted();
    });

    return () => {
      map.pm.removeControls();
      map.off("pm:create", handleCreate);
      map.off("pm:remove");
      map.off("pm:drawstart");
      map.off("pm:drawend");
    };
  }, [map, onPolygonCreated, onPolygonDeleted]);

  return null;
};

export default GeomanControl;
