import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import authRoutes from "./routes/authRoutes";
import weatherRoutes from "./routes/weatherRoutes";
import analysisRoutes from "./routes/analysisRoutes";
import fieldRoutes from "./routes/fieldRoutes";
import branchRoutes from "./routes/branchRoutes";
import { authenticate } from "./middlewares/authMiddleware";
import morganMiddleware from "./middlewares/morganMiddleware";
import { errorMiddleware } from "./middlewares/errorMiddleware";

const app = express();

// Middleware
app.use(morganMiddleware);
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
app.use("/api/analysis", analysisRoutes);
app.use("/api/fields", fieldRoutes);
app.use("/api/branches", branchRoutes);

// Health check route
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Smart Farm backend (TypeScript) is running",
  });
});

app.use(errorMiddleware);

//start server
if (process.env.NODE_ENV !== "test") {
  app.listen(ENV.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${ENV.PORT}`);
  });
}

export default app;
