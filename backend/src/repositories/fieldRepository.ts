import { pool } from "../config/db";

export const findFieldById = async (fieldId: string) => {
  const result = await pool.query(
    `SELECT id, user_id, name, area, centroid_lat, centroid_lng, polygon FROM fields WHERE id = $1`,
    [fieldId],
  );
  return result.rows[0] || null;
};

export const findFieldByIdAndUserId = async (fieldId: string, userId: string) => {
  const result = await pool.query(
    `SELECT id, polygon FROM fields WHERE id = $1 AND user_id = $2`,
    [fieldId, userId]
  );
  return result.rows[0] || null;
};

export const createField = async (
  userId: string,
  name: string,
  polygon: any,
  area: number,
  centroidLat: number,
  centroidLng: number,
) => {
  const result = await pool.query(
    `INSERT INTO fields (user_id, name, polygon, area, centroid_lat, centroid_lng)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, JSON.stringify(polygon), area, centroidLat, centroidLng],
  );
  return result.rows[0];
};

export const getFieldsByUserId = async (userId: string) => {
  const result = await pool.query(
    `SELECT id, name, area, centroid_lat, centroid_lng, polygon, created_at 
     FROM fields 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

export const deleteField = async (fieldId: string, userId: string) => {
  const result = await pool.query(
    `DELETE FROM fields 
     WHERE id = $1 AND user_id = $2 
     RETURNING id`,
    [fieldId, userId]
  );
  return result.rowCount ? result.rowCount > 0 : false;
};

export const updateFieldName = async (fieldId: string, userId: string, newName: string) => {
  const result = await pool.query(
    `UPDATE fields 
     SET name = $3
     WHERE id = $1 AND user_id = $2 
     RETURNING id, name`,
    [fieldId, userId, newName]
  );
  return result.rows[0];
};
