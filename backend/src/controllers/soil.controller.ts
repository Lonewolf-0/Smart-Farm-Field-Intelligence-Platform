import { Response } from "express";
import { AuthRequest } from "../types";
import { findFieldById } from "../repositories/field.repository";
import { getSoilProperties } from "../services/soil.service";
import { pool } from "../config/db";

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
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { fieldId } = req.params;
    if (!fieldId) {
      res.status(400).json({ success: false, error: "Field ID required" });
      return;
    }

    const field = await findFieldById(fieldId);
    if (!field) {
      res.status(404).json({ success: false, error: "Field not found" });
      return;
    }

    if (field.user_id !== user.id) {
      res.status(403).json({ success: false, error: "Forbidden: Not your field" });
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

    res.status(200).json({ success: true, data: historyResult.rows });
  } catch (error: any) {
    console.error("Soil History Error:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

export const getFieldSoil = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { fieldId } = req.params;
    if (!fieldId) {
      res.status(400).json({ success: false, error: "Field ID required" });
      return;
    }

    const field = await findFieldById(fieldId);
    if (!field) {
      res.status(404).json({ success: false, error: "Field not found" });
      return;
    }

    if (field.user_id !== user.id) {
      res.status(403).json({ success: false, error: "Forbidden: Not your field" });
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

    res.status(200).json({ success: true, data: newRecord });
  } catch (error: any) {
    console.error("Soil Data Error:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};
