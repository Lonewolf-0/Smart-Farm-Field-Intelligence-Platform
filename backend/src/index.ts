import express from "express";
import { ENV } from "./config/env";
import { pool } from "./config/db";
import authRoutes from "./routes/auth.routes";

const app = express();
// const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Middleware
app.use(express.json());

app.use("/api/auth", authRoutes);

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
