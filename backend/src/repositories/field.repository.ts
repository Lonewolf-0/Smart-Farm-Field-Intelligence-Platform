import { pool } from "../config/db";

export const findFieldById = async (fieldId: string) => {
  const result = await pool.query(
    `SELECT id,user_id,centroid_lat,
        centroid_lng FROM fields where ID=$1`,
    [fieldId],
  );
  return result.rows[0] || null;
};
