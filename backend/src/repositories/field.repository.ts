import { pool } from "../config/db";

export const findFieldById = async (fieldId: string) => {
  const result = await pool.query(
    `SELECT id,user_id,centroid_lat,
        centroid_lng FROM fields where ID=$1`,
    [fieldId],
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
