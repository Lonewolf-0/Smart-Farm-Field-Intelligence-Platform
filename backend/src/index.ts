import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { pool } from "./config/db";
import authRoutes from "./routes/auth.routes";
import weatherRoutes from "./routes/weather.routes";

import { authenticate } from "./middlewares/auth.middleware";

const app = express();
// const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Middleware
// JSON body parsing
app.use(express.json());

// Enable CORS for frontend origin (default to vite dev server)
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.options("*", cors());

app.use("/api/auth", authRoutes);
app.use("/api/weather", weatherRoutes);

// Health check route
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Smart Farm backend (TypeScript) is running",
  });
});

//start server
app.listen(ENV.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${ENV.PORT}`);
});
