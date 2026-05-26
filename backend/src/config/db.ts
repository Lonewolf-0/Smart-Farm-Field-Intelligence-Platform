import pkg from "pg";
import { ENV } from "./env";

const { Pool } = pkg;

export const pool = new Pool({
  host: ENV.DB_HOST,
  port: Number(ENV.DB_PORT),
  database: ENV.DB_NAME,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
});
