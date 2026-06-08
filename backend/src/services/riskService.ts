import { WeatherData, SoilAnalysisInput } from "../types";

export type RiskAlertType =
  | "drought"
  | "frost"
  | "heat_stress"
  | "heavy_rain"
  | "flooding"
  | "hail";

export interface RiskAlert {
  type: RiskAlertType;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  expectedDate: string;
  duration: string;
  recommendation: string;
}

export const assessRisks = (
  weather: WeatherData,
  soil: SoilAnalysisInput,
): RiskAlert[] => {
  const alerts: RiskAlert[] = [];
  const forecast = weather.forecast || [];

  //DROUGHT
  const dryDays = forecast.filter((f) => f.precipitation === 0);
  const hotDays = forecast.filter((f) => f.tempMax > 35);

  if (dryDays.length >= 7 && hotDays.length >= 7) {
    alerts.push({
      type: "drought",
      severity: dryDays.length >= 10 ? "high" : "medium",
      message: "No rainfall with high temperature detected",
      expectedDate: forecast[0]?.date,
      duration: `${dryDays.length} days`,
      recommendation: "Prepare irrigation, apply mulch",
    });
  }

  //FROST
  forecast.forEach((day) => {
    if (day.tempMin < 2) {
      alerts.push({
        type: "frost",
        severity: day.tempMin < 0 ? "high" : "medium",
        message: "Frost risk detected",
        expectedDate: day.date,
        duration: `1 day`,
        recommendation: "Cover crops,avoid night irrigation",
      });
    }
  });

  //HEAT STRESS
  let count = 0;
  forecast.forEach((day) => {
    if (day.tempMax > 40) count++;
    else count = 0;

    if (count >= 2) {
      alerts.push({
        type: "heat_stress",
        severity: day.tempMax > 42 ? "high" : "medium",
        message: "Heat stress detected",
        expectedDate: day.date,
        duration: `${count} days`,
        recommendation: "Increase irrigation,use shade nets",
      });
    }
  });

  //HEAVY RAIN
  forecast.forEach((day) => {
    if (day.precipitation > 50) {
      alerts.push({
        type: "heavy_rain",
        severity: day.precipitation > 80 ? "high" : "medium",
        message: "Heat rainfall expected",
        expectedDate: day.date,
        duration: `1 day`,
        recommendation: "Ensure drainage,delay fertilizer",
      });
    }
  });

  // HEAVY RAIN (cumulative 3-day)
  for (let i = 0; i <= forecast.length - 3; i++) {
    const totalRain =
      Number(forecast[i]?.precipitation || 0) +
      Number(forecast[i + 1]?.precipitation || 0) +
      Number(forecast[i + 2]?.precipitation || 0);

    if (totalRain >= 100) {
      alerts.push({
        type: "heavy_rain",
        severity: "high",
        message: "Heavy rainfall expected over 3 consecutive days",
        expectedDate: forecast[i]?.date,
        duration: "3 days",
        recommendation:
          "Ensure drainage channels are clear. Avoid field operations.",
      });

      break; // prevent duplicate alerts
    }
  }

  //FLOODING(soil+rain)
  if (
    soil.soilTexture.includes("clay") &&
    forecast.some((f) => f.precipitation > 50)
  ) {
    alerts.push({
      type: "flooding",
      severity: "high",
      message: "Flooding risk",
      expectedDate: forecast[0]?.date,
      duration: "2-3 days",
      recommendation: "prepare drainage",
    });
  }

  //HAIL
  forecast.forEach((day) => {
    if (day.condition?.toLowerCase().includes("thunder")) {
      alerts.push({
        type: "hail",
        severity: "high",
        message: "possible hailstorm",
        expectedDate: day.date,
        duration: "few hours",
        recommendation: "Use nets,harvest early",
      });
    }
  });

  return alerts;
};
