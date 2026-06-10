import { Response } from "express";
import { AuthRequest } from "../types";
import { findFieldByIdService } from "../services/fieldService";
import { getHistoryByFieldIdService, insertSoilDataService, getSoilProperties, analyzeSoilTrends } from "../services/soilService";
import { sendResponse } from "../utils/response";

const getSeason = (month: number): string => {
  if (month >= 2 && month <= 4) return "Kharif preparation";
  if (month >= 5 && month <= 8) return "Kharif";
  if (month >= 9 && month <= 10) return "Rabi preparation";
  return "Rabi"; // 11, 0, 1
};

export const getFieldSoilHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { fieldId } = req.params;
    if (!fieldId) {
      sendResponse(res, 400, "Field ID required", null, "Field ID required");
      return;
    }

    const field = await findFieldByIdService(fieldId);
    if (!field) {
      sendResponse(res, 404, "Field not found", null, "Field not found");
      return;
    }

    if (field.user_id !== user.id) {
      sendResponse(res, 403, "Forbidden: Not your field", null, "Forbidden");
      return;
    }

    // Fetch history from database
    const historyResult = await getHistoryByFieldIdService(fieldId);
    
    // Generate alerts via trend analysis service
    const alerts = analyzeSoilTrends(historyResult.rows.slice(0, 3));

    sendResponse(res, 200, "Success", {
      records: historyResult.rows,
      alerts
    });
  } catch (error: any) {
    console.error("Soil History Error:", error);
    sendResponse(res, 500, "Internal server error", null, error.message);
  }
};

export const getFieldSoil = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { fieldId } = req.params;
    if (!fieldId) {
      sendResponse(res, 400, "Field ID required", null, "Field ID required");
      return;
    }

    const field = await findFieldByIdService(fieldId);
    if (!field) {
      sendResponse(res, 404, "Field not found", null, "Field not found");
      return;
    }

    if (field.user_id !== user.id) {
      sendResponse(res, 403, "Forbidden: Not your field", null, "Forbidden");
      return;
    }

    // Fetch soil data
    const soilData = await getSoilProperties(field.centroid_lat, field.centroid_lng);

    // Determine current year and season
    const now = new Date();
    const year = now.getFullYear();
    const season = getSeason(now.getMonth());

    // Save to database
    await insertSoilDataService(fieldId, year, season, soilData);

    // Return the newly created record format
    const newRecord = {
      year,
      season,
      data: soilData,
      created_at: now.toISOString()
    };

    sendResponse(res, 200, "Success", newRecord);
  } catch (error: any) {
    console.error("Soil Data Error:", error);
    sendResponse(res, 500, "Internal server error", null, error.message);
  }
};
