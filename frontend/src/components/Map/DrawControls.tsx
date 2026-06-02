import { useRef, useEffect, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface DrawControlsProps {
  onPolygonCreated: (geoJSON: GeoJSON.Polygon, area: number) => void;
  onPolygonDeleted: () => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
}

// --- Marker icon factories ---

function createVertexIcon(): L.DivIcon {
  return L.divIcon({
    className: "custom-vertex-marker",
    html: `<div style="
      width: 14px; height: 14px;
      background: #22c55e;
      border: 2.5px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(0,0,0,0.4);
      cursor: grab;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createMidpointIcon(): L.DivIcon {
  return L.divIcon({
    className: "custom-midpoint-marker",
    html: `<div style="
      width: 10px; height: 10px;
      background: rgba(34,197,94,0.5);
      border: 2px solid rgba(255,255,255,0.8);
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.15s ease;
    " onmouseenter="this.style.transform='scale(1.5)'" onmouseleave="this.style.transform='scale(1)'"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function createPreviewIcon(): L.DivIcon {
  return L.divIcon({
    className: "custom-preview-marker",
    html: `<div style="
      width: 10px; height: 10px;
      background: rgba(34,197,94,0.6);
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

// --- Area calculation ---

function computeArea(latlngs: L.LatLng[]): number {
  if (latlngs.length < 3) return 0;
  const area = L.GeometryUtil.geodesicArea(latlngs);
  return area / 10000; // hectares
}

function toGeoJSON(latlngs: L.LatLng[]): GeoJSON.Polygon {
  const coords = latlngs.map((ll) => [ll.lng, ll.lat]);
  // Close the ring
  if (coords.length > 0) {
    coords.push([...coords[0]]);
  }
  return {
    type: "Polygon",
    coordinates: [coords],
  };
}

const DrawControls: React.FC<DrawControlsProps> = ({
  onPolygonCreated,
  onPolygonDeleted,
  isDrawing,
  setIsDrawing,
}) => {
  const map = useMap();

  // --- Refs for drawing state ---
  const drawingPointsRef = useRef<L.LatLng[]>([]);
  const previewMarkersRef = useRef<L.Marker[]>([]);
  const drawPolylineRef = useRef<L.Polyline | null>(null);
  const ghostLineRef = useRef<L.Polyline | null>(null);

  // --- Refs for completed polygon state ---
  const polygonLayerRef = useRef<L.Polygon | null>(null);
  const vertexMarkersRef = useRef<L.Marker[]>([]);
  const midpointMarkersRef = useRef<L.Marker[]>([]);

  // --- Ref to track isDrawing inside event handlers ---
  const isDrawingRef = useRef(isDrawing);
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  // --- Clean up drawing artifacts ---
  const clearDrawingArtifacts = useCallback(() => {
    previewMarkersRef.current.forEach((m) => m.remove());
    previewMarkersRef.current = [];
    drawPolylineRef.current?.remove();
    drawPolylineRef.current = null;
    ghostLineRef.current?.remove();
    ghostLineRef.current = null;
    drawingPointsRef.current = [];
  }, []);

  // --- Clean up completed polygon and its edit handles ---
  const clearPolygon = useCallback(() => {
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];
    midpointMarkersRef.current.forEach((m) => m.remove());
    midpointMarkersRef.current = [];
    polygonLayerRef.current?.remove();
    polygonLayerRef.current = null;
  }, []);

  // --- Build / rebuild edit handles for an existing polygon ---
  const buildEditHandles = useCallback(
    (latlngs: L.LatLng[]) => {
      // Remove old handles
      vertexMarkersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current = [];
      midpointMarkersRef.current.forEach((m) => m.remove());
      midpointMarkersRef.current = [];

      // Vertex markers (draggable)
      latlngs.forEach((ll, idx) => {
        const marker = L.marker(ll, {
          icon: createVertexIcon(),
          draggable: true,
          zIndexOffset: 1000,
        }).addTo(map);

        marker.on("drag", () => {
          const pos = marker.getLatLng();
          latlngs[idx] = pos;
          polygonLayerRef.current?.setLatLngs(latlngs);
        });

        marker.on("dragend", () => {
          // Recalculate area + rebuild midpoints
          const area = computeArea(latlngs);
          const geoJSON = toGeoJSON(latlngs);
          onPolygonCreated(geoJSON, area);
          buildEditHandles(latlngs);
        });

        vertexMarkersRef.current.push(marker);
      });

      // Midpoint markers (click to insert new vertex)
      if (latlngs.length >= 2) {
        for (let i = 0; i < latlngs.length; i++) {
          const next = (i + 1) % latlngs.length;
          const midLat = (latlngs[i].lat + latlngs[next].lat) / 2;
          const midLng = (latlngs[i].lng + latlngs[next].lng) / 2;

          const midMarker = L.marker([midLat, midLng], {
            icon: createMidpointIcon(),
            draggable: true,
            zIndexOffset: 900,
          }).addTo(map);

          // Capture index for closure
          const insertAfter = i;

          midMarker.on("dragstart", () => {
            // Promote midpoint to a real vertex upon drag
            const pos = midMarker.getLatLng();
            latlngs.splice(insertAfter + 1, 0, pos);
            polygonLayerRef.current?.setLatLngs(latlngs);
          });

          midMarker.on("drag", () => {
            const pos = midMarker.getLatLng();
            latlngs[insertAfter + 1] = pos;
            polygonLayerRef.current?.setLatLngs(latlngs);
          });

          midMarker.on("dragend", () => {
            const area = computeArea(latlngs);
            const geoJSON = toGeoJSON(latlngs);
            onPolygonCreated(geoJSON, area);
            buildEditHandles(latlngs);
          });

          midMarker.on("click", () => {
            // Insert a new vertex at the midpoint
            const pos = midMarker.getLatLng();
            latlngs.splice(insertAfter + 1, 0, pos);
            polygonLayerRef.current?.setLatLngs(latlngs);
            const area = computeArea(latlngs);
            const geoJSON = toGeoJSON(latlngs);
            onPolygonCreated(geoJSON, area);
            buildEditHandles(latlngs);
          });

          midpointMarkersRef.current.push(midMarker);
        }
      }
    },
    [map, onPolygonCreated],
  );

  // --- Finish drawing and create polygon ---
  const finishDrawing = useCallback(() => {
    const points = drawingPointsRef.current;
    if (points.length < 3) {
      clearDrawingArtifacts();
      setIsDrawing(false);
      return;
    }

    // Clear any previous polygon
    clearPolygon();

    // Create the polygon layer
    const latlngs = [...points];
    const polygon = L.polygon(latlngs, {
      color: "#22c55e",
      fillColor: "#22c55e",
      fillOpacity: 0.3,
      weight: 3,
    }).addTo(map);

    polygonLayerRef.current = polygon;

    // Calculate area
    const area = computeArea(latlngs);
    const geoJSON = toGeoJSON(latlngs);
    onPolygonCreated(geoJSON, area);

    // Build draggable handles
    buildEditHandles(latlngs);

    // Clean up drawing artifacts
    clearDrawingArtifacts();
    setIsDrawing(false);

    // Re-enable double-click zoom
    map.doubleClickZoom.enable();
  }, [
    map,
    onPolygonCreated,
    setIsDrawing,
    clearDrawingArtifacts,
    clearPolygon,
    buildEditHandles,
  ]);

  // --- Update polyline preview during drawing ---
  const updateDrawPreview = useCallback(() => {
    const points = drawingPointsRef.current;
    if (points.length < 2) {
      drawPolylineRef.current?.remove();
      drawPolylineRef.current = null;
      return;
    }

    if (drawPolylineRef.current) {
      drawPolylineRef.current.setLatLngs(points);
    } else {
      drawPolylineRef.current = L.polyline(points, {
        color: "#22c55e",
        weight: 3,
        dashArray: "8, 6",
        opacity: 0.85,
      }).addTo(map);
    }
  }, [map]);

  // --- Map click handler (add point while drawing) ---
  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingRef.current) return;

      const latlng = e.latlng;
      drawingPointsRef.current.push(latlng);

      // Add preview marker
      const marker = L.marker(latlng, {
        icon: createPreviewIcon(),
        interactive: false,
      }).addTo(map);
      previewMarkersRef.current.push(marker);

      updateDrawPreview();
    };

    const handleDoubleClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingRef.current) return;

      // Prevent double-click zoom
      L.DomEvent.stopPropagation(e as unknown as Event);
      L.DomEvent.preventDefault(e as unknown as Event);

      // The double-click also fires two single clicks, so the last point
      // is already added (or will be). Remove the duplicate last point
      // that the second click of the double-click added.
      const points = drawingPointsRef.current;
      if (points.length > 1) {
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        if (
          last &&
          prev &&
          last.lat === prev.lat &&
          last.lng === prev.lng
        ) {
          points.pop();
          const dupMarker = previewMarkersRef.current.pop();
          dupMarker?.remove();
        }
      }

      finishDrawing();
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!isDrawingRef.current) return;
      const points = drawingPointsRef.current;
      if (points.length === 0) return;

      // Ghost line from last point to cursor
      const ghostPoints = [points[points.length - 1], e.latlng];
      if (ghostLineRef.current) {
        ghostLineRef.current.setLatLngs(ghostPoints);
      } else {
        ghostLineRef.current = L.polyline(ghostPoints, {
          color: "#22c55e",
          weight: 2,
          dashArray: "4, 4",
          opacity: 0.5,
        }).addTo(map);
      }
    };

    map.on("click", handleMapClick);
    map.on("dblclick", handleDoubleClick);
    map.on("mousemove", handleMouseMove);

    return () => {
      map.off("click", handleMapClick);
      map.off("dblclick", handleDoubleClick);
      map.off("mousemove", handleMouseMove);
    };
  }, [map, finishDrawing, updateDrawPreview]);

  // --- Handle isDrawing toggle (start / cancel) ---
  useEffect(() => {
    if (isDrawing) {
      // Starting a new drawing session
      map.doubleClickZoom.disable();
      clearPolygon();
      onPolygonDeleted();

      // Set crosshair cursor
      const container = map.getContainer();
      container.style.cursor = "crosshair";
    } else {
      // Stopped drawing (either finished or cancelled)
      clearDrawingArtifacts();

      // Restore cursor
      const container = map.getContainer();
      container.style.cursor = "";

      // Re-enable double-click zoom if no polygon is being edited
      if (!polygonLayerRef.current) {
        map.doubleClickZoom.enable();
      }
    }
  }, [isDrawing, map, clearDrawingArtifacts, clearPolygon, onPolygonDeleted]);

  // --- Expose clear for external clear button ---
  // When the parent clears drawnPolygon, the component re-renders.
  // We watch for the polygon being externally cleared via onPolygonDeleted
  // by checking if polygonLayerRef still has a polygon when hasPolygon goes false.
  // This is handled in FarmMap's handleClearPolygon calling clearLayers.

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      clearDrawingArtifacts();
      clearPolygon();
      map.doubleClickZoom.enable();
      const container = map.getContainer();
      container.style.cursor = "";
    };
  }, [map, clearDrawingArtifacts, clearPolygon]);

  return null;
};

export default DrawControls;
