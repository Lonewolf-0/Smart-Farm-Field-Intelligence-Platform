import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set in environment variables");
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const run = async () => {
  try {
    await client.connect();
    console.log("Connected to database...");

    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
          id uuid DEFAULT public.uuid_generate_v4() NOT NULL PRIMARY KEY,
          name character varying(255) NOT NULL,
          email character varying(255) NOT NULL UNIQUE,
          password character varying(255) NOT NULL,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created users table");

    // Create fields table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.fields (
          id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          name character varying(255) NOT NULL,
          polygon jsonb NOT NULL,
          area double precision NOT NULL,
          centroid_lat double precision NOT NULL,
          centroid_lng double precision NOT NULL,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_fields_user_id ON public.fields USING btree (user_id);
    `);
    console.log("Created fields table");

    // Create soil_data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.soil_data (
          id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
          field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
          year integer NOT NULL,
          season character varying(50) NOT NULL,
          data jsonb NOT NULL,
          created_at timestamp with time zone DEFAULT now()
      );
    `);
    console.log("Created soil_data table");

    // Create branches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.branches (
          id character varying(255) NOT NULL PRIMARY KEY,
          name character varying(255) NOT NULL,
          latitude double precision NOT NULL,
          longitude double precision NOT NULL,
          address character varying(255) NOT NULL,
          phone character varying(255),
          services jsonb,
          products jsonb
      );
    `);
    console.log("Created branches table");

    // Populate branches
    const branchesDataPath = path.join(__dirname, "branches.json");
    const branchesData = JSON.parse(fs.readFileSync(branchesDataPath, "utf8"));

    // Insert or update branches
    console.log(`Inserting ${branchesData.length} branches...`);
    for (const branch of branchesData) {
      await client.query(
        `
        INSERT INTO public.branches (id, name, latitude, longitude, address, phone, services, products)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          services = EXCLUDED.services,
          products = EXCLUDED.products;
      `,
        [
          branch.id,
          branch.name,
          branch.latitude,
          branch.longitude,
          branch.address,
          branch.phone,
          JSON.stringify(branch.services),
          JSON.stringify(branch.products),
        ]
      );
    }
    console.log("Successfully populated branches data!");
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

run();
