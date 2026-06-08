import { findFieldById } from "../repositories/field.repository";
import { findLatestSoilByFieldId } from "../repositories/soil.repository";

import { getWeatherData } from "./weather.service";
import { assessRisks } from "./riskService";

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
