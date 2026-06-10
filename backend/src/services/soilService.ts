import axios from 'axios';
import https from 'https';
import { 
  findLatestSoilByFieldId, 
  findLatestSoilByCreatedAt, 
  getHistoryByFieldId, 
  insertSoilData 
} from '../repositories/soilRepository';

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

/**
 * Calculates the soil texture class based on clay and sand percentages.
 * 
 * @param {number | null} clay - The percentage of clay in the soil.
 * @param {number | null} sand - The percentage of sand in the soil.
 * @returns {string} The computed soil texture class (e.g., "Clay", "Sandy", "Loam").
 */
const calculateTexture = (clay: number | null, sand: number | null): string => {
  if (clay === null || sand === null) return "Unknown";
  
  if (clay > 40) return "Clay";
  if (sand > 60) return "Sandy";
  if (clay >= 25 && clay <= 40 && sand >= 20 && sand <= 45) return "Loam";
  if (clay < 25 && sand > 50) return "Sandy Loam";
  return "Loam";
};

/**
 * Fetches soil properties for a given latitude and longitude from the SoilGrids API.
 * Retrieves data for multiple depths (0-5cm, 5-15cm, 15-30cm) and properties
 * (pH, organic carbon, clay, sand, nitrogen).
 * 
 * @param {number} lat - The latitude coordinate.
 * @param {number} lon - The longitude coordinate.
 * @param {number} [retries=3] - Number of retry attempts in case of API failure.
 * @returns {Promise<SoilData>} The aggregated soil data across different depth layers.
 * @throws {Error} If the API request fails after all retries.
 */
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

/**
 * Analyzes historical soil records to detect trends in pH, organic carbon, and nitrogen,
 * and generates actionable agricultural alerts if negative trends are identified.
 * 
 * @param {any[]} recentRecords - An array of recent soil data records, sorted by time.
 * @returns {Array<{ type: string, severity: string, message: string }>} A list of alerts based on soil degradation trends.
 */
export const analyzeSoilTrends = (recentRecords: any[]) => {
  const alerts: Array<{ type: string, severity: string, message: string }> = [];
  
  if (recentRecords.length >= 2) {
    const newest = recentRecords[0];
    const oldest = recentRecords[recentRecords.length - 1];
    
    const yearsElapsed = Math.max(1, newest.year - oldest.year);
    
    const newestTop = newest.data.layers?.[0];
    const oldestTop = oldest.data.layers?.[0];
    
    if (newestTop && oldestTop) {
      // pH trend
      if (oldestTop.ph !== null && newestTop.ph !== null) {
        const phDropPerYear = (oldestTop.ph - newestTop.ph) / yearsElapsed;
        if (phDropPerYear > 0.3) {
          alerts.push({
            type: "pH",
            severity: "warning",
            message: "Soil becoming acidic. Consider liming."
          });
        }
      }
      
      // OC trend (stored as g/kg. API gives 10x percentage. So drop of 0.2% = 2.0 g/kg)
      if (oldestTop.organicCarbon !== null && newestTop.organicCarbon !== null) {
        const ocDropGKgPerYear = (oldestTop.organicCarbon - newestTop.organicCarbon) / yearsElapsed;
        const ocDropPercentPerYear = ocDropGKgPerYear / 10;
        if (ocDropPercentPerYear > 0.2) {
          alerts.push({
            type: "Organic Carbon",
            severity: "critical",
            message: "Organic matter declining. Add compost/green manure."
          });
        }
      }
      
      // Nitrogen trend
      if (oldestTop.nitrogen !== null && newestTop.nitrogen !== null) {
        const nDropPerYear = (oldestTop.nitrogen - newestTop.nitrogen) / yearsElapsed;
        if (nDropPerYear > 5) {
          alerts.push({
            type: "Nitrogen",
            severity: "warning",
            message: "Nitrogen depletion detected. Consider legume rotation."
          });
        }
      }
    }
  }
  
    return alerts;
};

export const findLatestSoilByFieldIdService = async (fieldId: string) => {
  return await findLatestSoilByFieldId(fieldId);
};

export const findLatestSoilByCreatedAtService = async (fieldId: string) => {
  return await findLatestSoilByCreatedAt(fieldId);
};

export const getHistoryByFieldIdService = async (fieldId: string) => {
  return await getHistoryByFieldId(fieldId);
};

export const insertSoilDataService = async (fieldId: string, year: number, season: string, data: any) => {
  return await insertSoilData(fieldId, year, season, data);
};
