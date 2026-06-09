import axios from "axios";
import https from "https";

interface NasaPowerData {
  date: string;
  tmean: number;
  tmax: number;
  tmin: number;
  precipitation: number;
  solarRadiation: number;
  et0: number; // Reference evapotranspiration
}

interface CacheEntry {
  timestamp: number;
  data: NasaPowerData[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map<string, CacheEntry>();

/**
 * Calculates Reference Evapotranspiration (ET0) using the Simplified Hargreaves equation
 * ET0 = 0.0023 * (Tmean + 17.8) * (Tmax - Tmin)^0.5 * Ra
 * @param tmean Mean temperature (°C)
 * @param tmax Maximum temperature (°C)
 * @param tmin Minimum temperature (°C)
 * @param ra Extraterrestrial radiation (MJ/m2/day)
 * @returns ET0 in mm/day
 */
const calculateET0 = (tmean: number, tmax: number, tmin: number, ra: number): number => {
  // Ensure we don't get negative values for the square root due to data anomalies
  const tempDiff = Math.max(0, tmax - tmin);
  const et0 = 0.0023 * (tmean + 17.8) * Math.sqrt(tempDiff) * ra;
  return Number(et0.toFixed(2));
};

/**
 * Fetches historical weather and environmental data from the NASA POWER API for a specific location.
 * Calculates daily Reference Evapotranspiration (ET0) based on the retrieved data.
 *
 * @param lat - Latitude of the target location.
 * @param lng - Longitude of the target location.
 * @param startDate - The start date for the data range in YYYYMMDD format.
 * @param endDate - The end date for the data range in YYYYMMDD format.
 * @returns A promise resolving to an array of daily weather and ET0 data.
 */
export const getNasaPowerData = async (
  lat: number,
  lng: number,
  startDate: string, // YYYYMMDD
  endDate: string // YYYYMMDD
): Promise<NasaPowerData[]> => {
  const cacheKey = `${lat}_${lng}_${startDate}_${endDate}`;
  const cachedEntry = cache.get(cacheKey);

  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    return cachedEntry.data;
  }

  try {
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point`;
    const params = {
      parameters: "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN",
      community: "AG",
      longitude: lng,
      latitude: lat,
      start: startDate,
      end: endDate,
      format: "JSON"
    };

    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get(url, { params, timeout: 10000, httpsAgent: agent });
    const properties = response.data?.properties?.parameter;

    if (!properties) {
      throw new Error("Invalid response from NASA POWER API");
    }

    const { T2M, T2M_MAX, T2M_MIN, PRECTOTCORR, ALLSKY_SFC_SW_DWN } = properties;

    // Keys in the parameter object are dates like "20260101"
    // Sort dates sequentially to ensure chronological order
    const dates = Object.keys(T2M).sort();

    // Iterate through each date to build the final dataset
    // Missing or invalid data from NASA POWER is typically represented as -999, so we normalize these to 0 or fallbacks
    const result: NasaPowerData[] = dates.map(date => {
      const tmean = T2M[date] !== -999 ? T2M[date] : 0;
      const tmax = T2M_MAX[date] !== -999 ? T2M_MAX[date] : tmean;
      const tmin = T2M_MIN[date] !== -999 ? T2M_MIN[date] : tmean;
      const precipitation = PRECTOTCORR[date] !== -999 ? PRECTOTCORR[date] : 0;
      const solarRadiation = ALLSKY_SFC_SW_DWN[date] !== -999 ? ALLSKY_SFC_SW_DWN[date] : 0;

      // Calculate the daily reference evapotranspiration (ET0) using the Simplified Hargreaves equation
      const et0 = calculateET0(tmean, tmax, tmin, solarRadiation);

      return {
        date,
        tmean,
        tmax,
        tmin,
        precipitation,
        solarRadiation,
        et0
      };
    });

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error: any) {
    console.error("NASA POWER API Error:", error.message);
    throw new Error("Failed to fetch evapotranspiration data");
  }
};
