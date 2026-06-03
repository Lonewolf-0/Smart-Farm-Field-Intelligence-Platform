import { Response } from "express";
import { AuthRequest } from "../types";
import { findFieldById } from "../repositories/field.repository";
import { getSoilProperties } from "../services/soil.service";
import { pool } from "../config/db";
import { sendResponse } from "../utils/response";

const getSeason = (month: number): string => {
  if (month >= 2 && month <= 4) return "Kharif preparation";
  if (month >= 5 && month <= 8) return "Kharif";
  if (month >= 9 && month <= 10) return "Rabi preparation";
  return "Rabi"; // 11, 0, 1
};

export const getFieldSoilHistory = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Fetch history from database
    const historyResult = await pool.query(
      `SELECT id, year, season, data, created_at 
       FROM soil_data 
       WHERE field_id = $1 
       ORDER BY created_at DESC`,
      [fieldId]
    );

    const alerts: Array<{ type: string, severity: string, message: string }> = [];
    
    if (historyResult.rows.length >= 2) {
      const recentRecords = historyResult.rows.slice(0, 3);
      const newest = recentRecords[0];
      const oldest = recentRecords[recentRecords.length - 1];
      
      const yearsElapsed = Math.max(1, newest.year - oldest.year);
      
      const newestTop = newest.data.layers?.[0];
      const oldestTop = oldest.data.layers?.[0];
      
      if (newestTop && oldestTop) {
        // pH trend
        if (oldestTop.ph !== null && newestTop.ph !== null) {
          const phDropPerYear = (oldestTop.ph - newestTop.ph) / yearsElapsed;
          if (phDropPerYear > 0.3) {
            alerts.push({
              type: "pH",
              severity: "warning",
              message: "Soil becoming acidic. Consider liming."
            });
          }
        }
        
        // OC trend (stored as g/kg. API gives 10x percentage. So drop of 0.2% = 2.0 g/kg)
        if (oldestTop.organicCarbon !== null && newestTop.organicCarbon !== null) {
          const ocDropGKgPerYear = (oldestTop.organicCarbon - newestTop.organicCarbon) / yearsElapsed;
          const ocDropPercentPerYear = ocDropGKgPerYear / 10;
          if (ocDropPercentPerYear > 0.2) {
            alerts.push({
              type: "Organic Carbon",
              severity: "critical",
              message: "Organic matter declining. Add compost/green manure."
            });
          }
        }
        
        // Nitrogen trend
        if (oldestTop.nitrogen !== null && newestTop.nitrogen !== null) {
          const nDropPerYear = (oldestTop.nitrogen - newestTop.nitrogen) / yearsElapsed;
          if (nDropPerYear > 5) {
            alerts.push({
              type: "Nitrogen",
              severity: "warning",
              message: "Nitrogen depletion detected. Consider legume rotation."
            });
          }
        }
      }
    }

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

    // Fetch soil data
    const soilData = await getSoilProperties(field.centroid_lat, field.centroid_lng);

    // Determine current year and season
    const now = new Date();
    const year = now.getFullYear();
    const season = getSeason(now.getMonth());

    // Save to database
    await pool.query(
      `INSERT INTO soil_data (field_id, year, season, data)
       VALUES ($1, $2, $3, $4)`,
      [fieldId, year, season, JSON.stringify(soilData)]
    );

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
