import { Response } from "express";
import { AuthRequest } from "../types";
import { findFieldById } from "../repositories/field.repository";
import { getWeatherData } from "../services/weather.service";
import { getNasaPowerData } from "../services/nasaPower.service";
import { calculateIrrigation } from "../services/irrigationService";
import { sendResponse } from "../utils/response";
import { pool } from "../config/db";

export const getIrrigationPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      sendResponse(res, 401, "Unauthorized", null, "Unauthorized");
      return;
    }

    const { fieldId } = req.params;
    if (!fieldId) {
      sendResponse(res, 400, "Field ID required", null, "Field ID required");
      return;
    }

    const field = await findFieldById(fieldId);
    if (!field) {
      sendResponse(res, 404, "Field not found", null, "Field not found");
      return;
    }

    if (field.user_id !== user.id) {
      sendResponse(res, 403, "Forbidden: Not your field", null, "Forbidden");
      return;
    }

    // 1. Get latest soil data
    const soilResult = await pool.query(
      `SELECT data FROM soil_data WHERE field_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [fieldId]
    );

    if (soilResult.rows.length === 0 || !soilResult.rows[0].data || !soilResult.rows[0].data.layers) {
      sendResponse(res, 400, "Run soil analysis first", null, "Missing soil data");
      return;
    }

    const latestSoil = soilResult.rows[0].data;
    const topLayer = latestSoil.layers[0];
    
    if (!topLayer || !topLayer.texture) {
      sendResponse(res, 400, "Run soil analysis first", null, "Missing soil texture data");
      return;
    }

    // 2. Get weather data
    const weatherData = await getWeatherData(field.centroid_lat, field.centroid_lng);

    // 3. Get NASA POWER data (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    // Format YYYYMMDD
    const formatNasaDate = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    };
    
    const startStr = formatNasaDate(startDate);
    const endStr = formatNasaDate(endDate);

    const nasaData = await getNasaPowerData(field.centroid_lat, field.centroid_lng, startStr, endStr);

    // 4. Calculate irrigation
    const irrigationPlan = calculateIrrigation(
      { texture: topLayer.texture },
      weatherData,
      nasaData
    );

    sendResponse(res, 200, "Success", irrigationPlan);
  } catch (error: any) {
    console.error("Irrigation Plan Error:", error);
    sendResponse(res, 500, "Internal server error", null, error.message);
  }
};
