import { Response } from "express";
import { AuthRequest } from "../types";
import { pool } from "../config/db";
import { getNDVIData } from "../services/ndviService";
import { sendResponse } from "../utils/response";

export const getFieldNDVI = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, 401, "Unauthorized", null, "Unauthorized");
    }

    // 1. Fetch field and verify ownership
    const fieldResult = await pool.query(
      "SELECT id, polygon FROM fields WHERE id = $1 AND user_id = $2",
      [fieldId, userId]
    );

    if (fieldResult.rows.length === 0) {
      return sendResponse(res, 404, "Field not found", null, "Field not found");
    }

    const field = fieldResult.rows[0];
    const polygon = typeof field.polygon === "string" ? JSON.parse(field.polygon) : field.polygon;

    try {
      // 2. Call NDVI service
      const ndviData = await getNDVIData(polygon);

      // 3. Format response
      let healthScoreStr = "Poor";
      if (ndviData.averageNDVI > 0.7) healthScoreStr = "Excellent";
      else if (ndviData.averageNDVI > 0.5) healthScoreStr = "Good";
      else if (ndviData.averageNDVI > 0.3) healthScoreStr = "Moderate";
      
      const formattedResponse = {
        averageNDVI: ndviData.averageNDVI,
        healthScore: healthScoreStr,
        healthPercentage: ndviData.healthScore,
        stressAreas: ndviData.stressZones[0],
        lastImageDate: ndviData.timestamp
      };

      return sendResponse(res, 200, "NDVI data retrieved successfully", formattedResponse);

    } catch (error: any) {
      // 4. Handle missing credentials or errors gracefully
      console.warn("NDVI Service error or missing credentials, falling back to mock data:", error.message);
      
      // Return mock data with warning
      const mockResponse = {
        averageNDVI: 0.65,
        healthScore: "Good",
        healthPercentage: 80,
        stressAreas: 15.5,
        lastImageDate: new Date().toISOString(),
        warning: "Mock data used. Please configure Sentinel Hub credentials."
      };
      
      return sendResponse(res, 200, "Mock data used", mockResponse);
    }

  } catch (error) {
    console.error("Error in getFieldNDVI:", error);
    return sendResponse(res, 500, "Internal server error", null, "Internal server error");
  }
};
