import { pestDatabase, Treatment } from "../data/pestDatabase";
import { WeatherData } from "../types";

export interface PestRiskAssessment {
  pestName: string;
  riskLevel: "High" | "Medium" | "Low";
  riskScore: number;
  recommendation: string;
  treatment: Treatment | null;
}

export const assessPestRisk = (
  crop: string,
  weather: WeatherData,
  season: string
): PestRiskAssessment[] => {
  const cropPests = pestDatabase.filter((p) =>
    p.affectedCrops.map((c) => c.toLowerCase()).includes(crop.toLowerCase())
  );

  return cropPests.map((pest) => {
    let riskScore = 0;

    const { minTemp, maxTemp, minHumidity, season: pestSeason } =
      pest.favorableConditions;

    // 1. Temperature check (+30)
    if (
      minTemp !== undefined &&
      maxTemp !== undefined &&
      weather.temperature >= minTemp &&
      weather.temperature <= maxTemp
    ) {
      riskScore += 30;
    } else if (
      minTemp !== undefined &&
      maxTemp !== undefined &&
      weather.temperature >= minTemp - 3 &&
      weather.temperature <= maxTemp + 3
    ) {
      riskScore += 15;
    }

    // 2. Humidity check (+30)
    if (minHumidity !== undefined && weather.humidity >= minHumidity) {
      riskScore += 30;
    } else if (minHumidity !== undefined && weather.humidity >= minHumidity - 15) {
      riskScore += 15;
    }

    // 3. Season check (+20)
    const normalizedPestSeason = pestSeason.toLowerCase();
    const normalizedInputSeason = season.toLowerCase();
    
    // We do a loose check: if the pest season includes words from the input season
    if (
      normalizedPestSeason.includes(normalizedInputSeason) ||
      normalizedInputSeason.includes(normalizedPestSeason)
    ) {
      riskScore += 20;
    } else {
      // Fallback: If seasons are generic (like "kharif" vs "Monsoon"), give partial points
      riskScore += 10;
    }

    // 4. Rainfall check (+20)
    if (pest.type === "fungus") {
      if (weather.rainfall > 50) {
        riskScore += 20;
      } else if (weather.rainfall > 20) {
        riskScore += 10;
      }
    } else {
      // For pests (insects), heavy rain can wash them away, but dry conditions favor them
      if (weather.rainfall < 10) {
        riskScore += 20;
      } else if (weather.rainfall < 30) {
        riskScore += 10;
      }
    }

    // Cap at 100
    riskScore = Math.min(riskScore, 100);

    let riskLevel: "High" | "Medium" | "Low";
    let recommendation: string;
    let treatment: Treatment | null = null;

    if (riskScore > 70) {
      riskLevel = "High";
      recommendation = "Spray recommended";
      treatment = pest.treatments[0] || null;
    } else if (riskScore >= 40) {
      riskLevel = "Medium";
      recommendation = "Monitor closely";
    } else {
      riskLevel = "Low";
      recommendation = "No action needed";
    }

    return {
      pestName: pest.name,
      riskLevel,
      riskScore,
      recommendation,
      treatment,
    };
  });
};
