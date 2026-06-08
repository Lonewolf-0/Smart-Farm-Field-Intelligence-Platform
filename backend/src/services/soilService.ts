import axios from 'axios';
import https from 'https';

export interface SoilLayerData {
  depthLabel: string;
  ph: number | null;
  organicCarbon: number | null;
  clay: number | null;
  sand: number | null;
  nitrogen: number | null;
  texture: string;
}

export interface SoilData {
  layers: SoilLayerData[];
}

const calculateTexture = (clay: number | null, sand: number | null): string => {
  if (clay === null || sand === null) return "Unknown";
  
  if (clay > 40) return "Clay";
  if (sand > 60) return "Sandy";
  if (clay >= 25 && clay <= 40 && sand >= 20 && sand <= 45) return "Loam";
  if (clay < 25 && sand > 50) return "Sandy Loam";
  return "Loam";
};

export const getSoilProperties = async (lat: number, lon: number, retries = 3): Promise<SoilData> => {
  const url = `https://rest.isric.org/soilgrids/v2.0/properties/query`;
  const params = {
    lat,
    lon,
    property: ['phh2o', 'soc', 'clay', 'sand', 'nitrogen'],
    depth: ['0-5cm', '5-15cm', '15-30cm'],
    value: 'mean'
  };

  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        params,
        paramsSerializer: {
          indexes: null
        },
        timeout: 10000,
        httpsAgent
      });

      const layersFromApi = response.data?.properties?.layers;
      if (!layersFromApi || !Array.isArray(layersFromApi)) {
        // If it's an ocean coordinate, properties might be empty or layers missing.
        // We handle gracefully by returning empty layers.
        return { layers: [] };
      }

      const depthMap = new Map<string, Partial<SoilLayerData>>();

      layersFromApi.forEach((propLayer: any) => {
        const propName = propLayer.name;
        const d_factor = propLayer.unit_measure?.d_factor || 1;

        propLayer.depths?.forEach((d: any) => {
          const depthLabel = d.label;
          const meanVal = d.values?.mean;
          
          if (!depthMap.has(depthLabel)) {
            depthMap.set(depthLabel, { depthLabel });
          }
          
          const currentLayer = depthMap.get(depthLabel)!;
          
          if (meanVal !== undefined && meanVal !== null) {
            let convertedVal = meanVal / d_factor;
            
            if (propName === 'nitrogen') {
              // User wants cg/kg. Mapped units is cg/kg, so mean is in cg/kg.
              convertedVal = meanVal; 
            }
            
            switch (propName) {
              case 'phh2o': currentLayer.ph = meanVal / 10; break;
              case 'soc': currentLayer.organicCarbon = convertedVal; break;
              case 'clay': currentLayer.clay = convertedVal; break;
              case 'sand': currentLayer.sand = convertedVal; break;
              case 'nitrogen': currentLayer.nitrogen = convertedVal; break;
            }
          }
        });
      });

      const layers: SoilLayerData[] = Array.from(depthMap.values()).map(layer => {
        return {
          depthLabel: layer.depthLabel || "Unknown",
          ph: layer.ph ?? null,
          organicCarbon: layer.organicCarbon ?? null,
          clay: layer.clay ?? null,
          sand: layer.sand ?? null,
          nitrogen: layer.nitrogen ?? null,
          texture: calculateTexture(layer.clay ?? null, layer.sand ?? null)
        };
      });

      return { layers };
      
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`SoilGrids API failed after ${retries} attempts:`, error.message);
        throw new Error(`Failed to fetch soil data: ${error.message}`);
      }
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
  
  throw new Error("Failed to fetch soil data");
};
