import { Response } from "express";
import { AuthRequest } from "../types";
import { sendResponse } from "../utils/response";
import { findFieldById } from "../repositories/field.repository";
import { getWeatherData } from "../services/weather.service";
import { assessPestRisk } from "../services/pesticideService";
import { getCropSuitabilityService } from "../services/crop.service";

// Simple season determinator based on month
const getCurrentSeason = () => {
  const month = new Date().getMonth(); // 0 = Jan, 11 = Dec
  if (month >= 5 && month <= 8) return "Monsoon"; // Jun-Sep
  if (month >= 9 || month <= 2) return "Winter"; // Oct-Mar
  return "Spring / Warm Dry Weather"; // Apr-May
};

export const getPesticideRecommendation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?.id as string;
    const { crop, growthStage } = req.body || {};

    // 1. Fetch field and verify ownership
    const field = await findFieldById(fieldId);
    if (!field) {
      return sendResponse(res, 404, "Field not found");
    }

    if (field.user_id !== userId) {
      return sendResponse(res, 403, "Forbidden", null, "FIELD_ACCESS_DENIED");
    }

    // 2. Get weather data for field
    const weather = await getWeatherData(
      field.centroid_lat,
      field.centroid_lng
    );

    // 3. Get crop from request body or highest suitability score
    let targetCrop = crop;

    if (!targetCrop) {
      const crops = await getCropSuitabilityService(userId, fieldId);
      if (crops.length > 0) {
        targetCrop = crops[0].name;
      } else {
        return sendResponse(
          res,
          400,
          "Could not determine a target crop. Please provide one."
        );
      }
    }

    // 4. Determine current season
    const season = getCurrentSeason();

    // 5. Call pesticideService.assessPestRisk()
    const assessments = assessPestRisk(targetCrop, weather, season);

    // 6. Return formatted response
    return sendResponse(res, 200, "Pesticide recommendations fetched", {
      crop: targetCrop,
      growthStage: growthStage || "Unknown",
      season,
      assessments,
    });
  } catch (error: any) {
    return sendResponse(
      res,
      error.status || 500,
      error.message || "Failed to fetch pesticide recommendations",
      null,
      error.code || error.message
    );
  }
};
