import { WeatherData, IrrigationPlan } from "../types";

export const getAWCFromTexture = (texture: string): number => {
  const normalized = texture.toLowerCase();
  if (normalized.includes("clay")) return 175; // 150-200
  if (normalized === "loam") return 125; // 100-150
  if (normalized === "sandy loam") return 87.5; // 75-100
  if (normalized.includes("sand")) return 62.5; // 50-75
  return 125; // Default to loam
};

export const calculateIrrigation = (
  soil: { texture: string },
  weather: WeatherData,
  nasaData: any[]
): IrrigationPlan => {
  // 1. Get Soil AWC
  const awc = getAWCFromTexture(soil.texture);
  
  // 2. Calculate current soil moisture based on recent history
  // Start at 100% field capacity at the beginning of the available nasa data
  let currentMoisture = awc; 
  
  if (nasaData && nasaData.length > 0) {
    for (const day of nasaData) {
      currentMoisture -= day.et0;
      currentMoisture += day.precipitation;
      // Cap at field capacity
      if (currentMoisture > awc) currentMoisture = awc;
    }
  }

  // 3. Current ET and Rainfall
  const latestET0 = nasaData && nasaData.length > 0 
    ? nasaData[nasaData.length - 1].et0 
    : 3.0; // Fallback typical ET0

  let rainfallNext7Days = 0;
  if (weather && weather.forecast) {
    for (const f of weather.forecast) {
      rainfallNext7Days += f.precipitation || 0;
    }
  }

  // 4. Calculate days until irrigation
  const mad = awc * 0.5; // Management Allowed Depletion = 50%
  let projectedMoisture = currentMoisture;
  let nextIrrigationDays = 0;
  let waterRequired = 0;

  // Project forward up to 14 days
  for (let i = 0; i < 14; i++) {
    if (projectedMoisture <= mad) {
      nextIrrigationDays = i;
      waterRequired = awc - projectedMoisture;
      break;
    }
    
    // Apply daily changes
    projectedMoisture -= latestET0;
    
    // Add forecast rain if available for this day
    if (weather && weather.forecast && i < weather.forecast.length) {
      projectedMoisture += weather.forecast[i].precipitation || 0;
    }
    
    if (projectedMoisture > awc) projectedMoisture = awc;
  }

  if (nextIrrigationDays === 0 && projectedMoisture > mad) {
    // If we didn't drop below MAD after 14 days
    nextIrrigationDays = 14; 
    waterRequired = 0;
  }

  // If already below MAD today
  if (currentMoisture <= mad) {
    nextIrrigationDays = 0;
    waterRequired = awc - currentMoisture;
  }

  // 5. Final moisture percentage
  const currentSoilMoisturePercent = (currentMoisture / awc) * 100;

  return {
    nextIrrigationDays,
    waterRequired: Number(Math.max(0, waterRequired).toFixed(1)),
    currentSoilMoisture: Number(currentSoilMoisturePercent.toFixed(1)),
    dailyET: Number(latestET0.toFixed(2)),
    rainfallNext7Days: Number(rainfallNext7Days.toFixed(1))
  };
};
