import "leaflet";

declare module "leaflet" {
  namespace GeometryUtil {
    function geodesicArea(latLngs: L.LatLng[]): number;
    function readableArea(area: number, isMetric?: boolean): string;
  }

  namespace Draw {
    namespace Event {
      const CREATED: string;
      const EDITED: string;
      const DELETED: string;
      const DRAWSTART: string;
      const DRAWSTOP: string;
      const DRAWVERTEX: string;
    }
  }
}