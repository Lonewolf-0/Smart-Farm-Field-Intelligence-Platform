import { cropRequirements } from "../data/cropRequirements";
import { SoilAnalysisInput, CropSuitabilityV2 } from "../types";
import { WeatherData } from "../types";

export const calculateCropSuitability = (
  soil: SoilAnalysisInput,
  weather: WeatherData,
  returnAll = false,
): CropSuitabilityV2[] => {
  const avgTemp = weather.temperature;
  const rainfall = weather.rainfall * 365; // convert daily → yearly approx

  const results: CropSuitabilityV2[] = cropRequirements.map((crop) => {
    // PH SCORE
    let phScore = 10;
    if (soil.ph >= crop.minPH && soil.ph <= crop.maxPH) {
      phScore = 100;
    } else if (soil.ph >= crop.minPH - 0.5 && soil.ph <= crop.maxPH + 0.5) {
      phScore = 70;
    } else if (soil.ph >= crop.minPH - 1 && soil.ph <= crop.maxPH + 1) {
      phScore = 40;
    }

    // TEMPERATURE SCORE
    let tempScore = 10;
    if (avgTemp >= crop.minTemperature && avgTemp <= crop.maxTemperature) {
      tempScore = 100;
    } else if (
      avgTemp >= crop.minTemperature - 3 &&
      avgTemp <= crop.maxTemperature + 3
    ) {
      tempScore = 70;
    } else if (
      avgTemp >= crop.minTemperature - 6 &&
      avgTemp <= crop.maxTemperature + 6
    ) {
      tempScore = 40;
    }

    // RAINFALL SCORE
    let rainScore = 10;
    if (rainfall >= crop.minRainfall && rainfall <= crop.maxRainfall) {
      rainScore = 100;
    } else if (
      rainfall >= crop.minRainfall * 0.8 &&
      rainfall <= crop.maxRainfall * 1.2
    ) {
      rainScore = 70;
    } else if (
      rainfall >= crop.minRainfall * 0.6 &&
      rainfall <= crop.maxRainfall * 1.4
    ) {
      rainScore = 40;
    }

    // SOIL TEXTURE SCORE
    let textureScore = 20;

    if (crop.preferredSoilTexture.includes(soil.soilTexture)) {
      textureScore = 100;
    } else if (
      crop.preferredSoilTexture.some((t) =>
        ["loamy", "silty"].includes(soil.soilTexture),
      )
    ) {
      textureScore = 60;
    }

    // TOTAL SCORE (WEIGHTED)
    const totalScore =
      phScore * 0.3 + tempScore * 0.25 + rainScore * 0.25 + textureScore * 0.2;

    return {
      name: crop.name,
      score: Number(totalScore.toFixed(2)),
      breakdown: {
        ph: phScore,
        temperature: tempScore,
        rainfall: rainScore,
        soilTexture: textureScore,
      },
    };
  });

  const sorted = results.sort((a, b) => b.score - a.score);

  return returnAll ? sorted : sorted.slice(0, 10);
};
