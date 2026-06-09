import { findFieldById } from "../repositories/fieldRepository";
import { findLatestSoilByFieldId } from "../repositories/soilRepository";

import { getWeatherData } from "./weatherService";
import { assessRisks } from "./riskService";

/**
 * Orchestrates the gathering of field, soil, and weather data to perform a comprehensive risk analysis.
 * Validates user permissions before proceeding.
 *
 * @param userId - The ID of the user requesting the analysis.
 * @param fieldId - The ID of the field to be analyzed.
 * @returns A promise resolving to an array of identified risk alerts for the field.
 */
export const getRiskAnalysisService = async (
  userId: string,
  fieldId: string,
) => {
  //FIELD
  const field = await findFieldById(fieldId);
  if (!field) {
    throw { status: 404, message: "Field not found" };
  }

  if (field.user_id !== userId) {
    throw {
      status: 403,
      message: "Forbidden",
      code: "FIELD_ACCESS_DENIED",
    };
  }

  //SOIL
  const soil = await findLatestSoilByFieldId(fieldId);
  if (!soil) {
    throw { status: 400, message: "Run soil analysis first" };
  }

  const layer = soil.data.layers[0];

  const soilInput = {
    ph: layer.ph,
    organicCarbon: layer.organicCarbon,
    soilTexture: layer.texture.toLowerCase(),
  };

  //WEATHER
  const weather = await getWeatherData(field.centroid_lat, field.centroid_lng);

  //RISK ENGINE
  return assessRisks(weather, soilInput);
};
