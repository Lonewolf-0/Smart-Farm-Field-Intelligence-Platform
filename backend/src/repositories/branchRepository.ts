import { pool } from "../config/db";

export const getAllBranchesFromDb = async () => {
  const result = await pool.query("SELECT * FROM branches");
  return result.rows;
};

export const getBranchByIdFromDb = async (id: string) => {
  const result = await pool.query("SELECT * FROM branches WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const getBranchPricesFromDb = async (id: string) => {
  const result = await pool.query("SELECT products FROM branches WHERE id = $1", [id]);
  return result.rows[0] || null;
};

export const getNearestBranchesFromDb = async (lat: number, lng: number, limit: number) => {
  const query = `
    SELECT *, (
      6371 * acos(
        cos(radians($2)) * cos(radians(latitude)) * cos(radians(longitude) - radians($1)) +
        sin(radians($2)) * sin(radians(latitude))
      )
    ) AS distance
    FROM branches
    ORDER BY distance ASC
    LIMIT $3
  `;
  const result = await pool.query(query, [lng, lat, limit]);
  return result.rows;
};
