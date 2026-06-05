import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const ENV = {
  PORT: process.env.PORT || "5000",

  DB_HOST: requiredEnv("DB_HOST"),
  DB_PORT: requiredEnv("DB_PORT"),
  DB_NAME: requiredEnv("DB_NAME"),
  DB_USER: requiredEnv("DB_USER"),
  DB_PASSWORD: requiredEnv("DB_PASSWORD"),
  JWT_SECRET: requiredEnv("JWT_SECRET"),
  OPENWEATHER_API_KEY: requiredEnv("OPENWEATHER_API_KEY"),
  OPENWEATHER_BASE_URL: requiredEnv("OPENWEATHER_BASE_URL"),
  SENTINEL_HUB_CLIENT_ID:
    process.env.SENTINEL_HUB_CLIENT_ID || "your_client_id",
  SENTINEL_HUB_CLIENT_SECRET:
    process.env.SENTINEL_HUB_CLIENT_SECRET || "your_client_secret",
};
