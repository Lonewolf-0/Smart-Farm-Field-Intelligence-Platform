import { findFieldById } from "../repositories/fieldRepository";
import { findLatestSoilByFieldId } from "../repositories/soilRepository";

import { getWeatherData } from "./weatherService";
import { calculateCropSuitability } from "./cropSuitabilityService";

/**
 * Retrieves the crop suitability for a specific field based on its soil analysis and local weather data.
 * Concurrently fetches field and latest soil data, verifies ownership, and calculates suitability.
 * 
 * @param {string} userId - The ID of the user requesting the data.
 * @param {string} fieldId - The ID of the field to calculate suitability for.
 * @returns {Promise<CropSuitabilityV2[]>} An array of suitable crops with their suitability scores.
 * @throws {Object} If the field is not found, access is denied, or no soil analysis exists.
 */
export const getCropSuitabilityService = async (
  userId: string,
  fieldId: string,
) => {
  //  1. Fetch field and soil concurrently
  const [field, soil] = await Promise.all([
    findFieldById(fieldId),
    findLatestSoilByFieldId(fieldId),
  ]);

  if (!field) {
    throw {
      status: 404,
      message: "Field not found",
    };
  }

  //  2. Ownership check
  if (field.user_id !== userId) {
    throw {
      status: 403,
      message: "Forbidden",
      code: "FIELD_ACCESS_DENIED",
    };
  }

  if (!soil) {
    throw {
      status: 400,
      message: "Run soil analysis first",
    };
  }

  // 4. Transform soil

  const layer = soil.data.layers[0];

  const soilInput = {
    ph: layer.ph,
    organicCarbon: layer.organicCarbon,
    soilTexture: layer.texture.toLowerCase(),
  };

  // 5. Weather
  const weather = await getWeatherData(field.centroid_lat, field.centroid_lng);

  // 6. Suitability
  const crops = calculateCropSuitability(soilInput, weather);

  return crops;
};
