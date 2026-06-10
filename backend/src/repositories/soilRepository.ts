import { pool } from "../config/db";

export const findLatestSoilByFieldId = async (fieldId: string) => {
  const result = await pool.query(
    `SELECT * FROM soil_data WHERE field_id=$1 ORDER BY year DESC LIMIT 1`,
    [fieldId],
  );
  return result?.rows?.[0] ?? null;
};

export const findLatestSoilByCreatedAt = async (fieldId: string) => {
  const result = await pool.query(
    `SELECT data FROM soil_data WHERE field_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [fieldId],
  );
  return result?.rows?.[0] ?? null;
};

export const getHistoryByFieldId = async (fieldId: string) => {
  return pool.query(
    `SELECT id, year, season, data, created_at FROM soil_data WHERE field_id = $1 ORDER BY created_at DESC`,
    [fieldId]
  );
};

export const insertSoilData = async (fieldId: string, year: number, season: string, data: any) => {
  const result = await pool.query(
    `INSERT INTO soil_data (field_id, year, season, data)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [fieldId, year, season, JSON.stringify(data)]
  );
  return result.rows[0];
};
