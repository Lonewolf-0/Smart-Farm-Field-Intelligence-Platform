import { findFieldById } from "../repositories/field.repository";
import { findLatestSoilByFieldId } from "../repositories/soil.repository";

import { getWeatherData } from "./weather.service";
import { calculateCropSuitability } from "./crop-suitability.service";

export const getCropSuitabilityService = async (
  userId: string,
  fieldId: string,
) => {
  //  1. Fetch field
  const field = await findFieldById(fieldId);

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

  //  3. Get soil
  const soil = await findLatestSoilByFieldId(fieldId);

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
