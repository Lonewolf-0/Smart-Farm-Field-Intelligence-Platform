import { pool } from "../config/db";
import { User } from "../types";

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query(
    `SELECT id, email, name, created_at as "createdAt"
     FROM users WHERE email = $1`,
    [email],
  );

  return result.rows[0] || null;
};

export const createUser = async (
  name: string,
  email: string,
  password: string,
): Promise<User> => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at as "createdAt"`,
    [name, email, password],
  );

  return result.rows[0];
};
