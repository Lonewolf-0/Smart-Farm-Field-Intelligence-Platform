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
};
