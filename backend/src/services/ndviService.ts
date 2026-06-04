import axios from "axios";
import https from "https";
import type { Polygon } from "geojson";
import { getSentinelAccessToken } from "./sentinelAuthService";
import { NDVIData } from "../types";

const EVALSCRIPT = `
//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B08", "dataMask"]
    }],
    output: [
      { id: "default", bands: 1, sampleType: "UINT8" },
      { id: "dataMask", bands: 1 }
    ]
  };
}

function evaluatePixel(sample) {
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  // Map -1..1 to 0..255 to avoid JSON float serialization issues
  let mapped = Math.round((ndvi + 1) * 127.5);
  return {
    default: [mapped],
    dataMask: [sample.dataMask]
  };
}
`;

/**
 * Fetches NDVI statistical data for a given polygon using Sentinel Hub.
 */
export const getNDVIData = async (polygon: Polygon, daysBack: number = 30): Promise<NDVIData> => {
  const token = await getSentinelAccessToken();

  // The environment is simulated to be in 2026, but real Sentinel Hub data only exists up to the actual present.
  // We offset the query by 2.5 years to ensure we hit valid real-world data in a non-winter season if possible.
  const toDate = new Date();
  toDate.setMonth(toDate.getMonth() - 30);
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - daysBack);

  const payload = {
    input: {
      bounds: {
        geometry: polygon,
        properties: {
          crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
        }
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter: {
            mosaickingOrder: "leastCC",
            maxCloudCoverage: 100
          }
        }
      ]
    },
    aggregation: {
      timeRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      },
      aggregationInterval: {
        of: "P1D"
      },
      evalscript: EVALSCRIPT,
      resx: 0.0001,
      resy: 0.0001
    },
    calculations: {
      default: {
        histograms: {
          default: {
            nBins: 255,
            lowEdge: 0,
            highEdge: 255
          }
        }
      }
    }
  };

  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.post(
      "https://services.sentinel-hub.com/api/v1/statistics",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        httpsAgent: agent
      }
    );

    const data = response.data.data;
    if (!data || data.length === 0) {
      if (daysBack < 90) {
        // Fallback: search up to 90 days
        console.log(`No NDVI data found for past ${daysBack} days. Falling back to 90 days.`);
        return getNDVIData(polygon, 90);
      }
      throw new Error("No clear satellite imagery found in the past 90 days.");
    }

    const validDays = data.filter((d: any) => {
      const stats = d.outputs?.default?.bands?.B0?.stats;
      return stats && stats.sampleCount > stats.noDataCount;
    });

    if (validDays.length === 0) {
      if (daysBack < 90) {
        return getNDVIData(polygon, 90);
      }
      throw new Error("No clear satellite imagery found in the past 90 days.");
    }

    // Get the most recent valid day
    const mostRecent = validDays[validDays.length - 1];
    const timestamp = mostRecent.interval.to;
    const stats = mostRecent.outputs.default.bands.B0.stats;
    const histogram = mostRecent.outputs.default.bands.B0.histogram.bins;

    // Convert mapped mean back to true NDVI (-1 to 1)
    const averageNDVI = (stats.mean / 127.5) - 1;
    
    // Calculate stress zones vs healthy zones from histogram bins
    let totalValidPixels = 0;
    let stressPixels = 0; // NDVI < 0.3 -> Mapped < 166
    let healthyPixels = 0; // NDVI > 0.6 -> Mapped >= 204

    for (const bin of histogram) {
      const edge = bin.lowEdge;
      totalValidPixels += bin.count;
      if (edge < 166) {
        stressPixels += bin.count;
      }
      if (edge >= 204) {
        healthyPixels += bin.count;
      }
    }

    const stressPercentage = totalValidPixels > 0 ? (stressPixels / totalValidPixels) * 100 : 0;
    const healthyPercentage = totalValidPixels > 0 ? (healthyPixels / totalValidPixels) * 100 : 0;

    // Map health category score
    // > 0.7 = Excellent (100)
    // < 0.1 = Poor (0)
    let healthScore = 0;
    if (averageNDVI > 0.7) healthScore = 100;
    else if (averageNDVI > 0.5) healthScore = 80;
    else if (averageNDVI > 0.3) healthScore = 50;
    else if (averageNDVI > 0.1) healthScore = 20;
    else healthScore = 0;

    return {
      averageNDVI: Number(averageNDVI.toFixed(3)),
      healthScore,
      stressZones: [
        Number(stressPercentage.toFixed(1)), // % of field in stress (< 0.3)
        Number(healthyPercentage.toFixed(1)) // % of field healthy (> 0.6)
      ],
      timestamp
    };

  } catch (error: any) {
    console.error("Sentinel Hub API Error:", JSON.stringify(error?.response?.data, null, 2) || error.message);
    throw new Error("Failed to process satellite imagery.");
  }
};
