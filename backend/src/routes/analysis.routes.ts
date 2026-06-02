import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getFieldWeather } from "../controllers/weather.controller";

const router = Router();

router.post("/:fieldId/weather", authenticate, getFieldWeather);

export default router;
