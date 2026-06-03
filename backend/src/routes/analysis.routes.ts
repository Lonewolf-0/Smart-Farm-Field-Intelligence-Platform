import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getFieldWeather } from "../controllers/weather.controller";
import { getFieldSoil } from "../controllers/soil.controller";

const router = Router();

router.post("/:fieldId/weather", authenticate, getFieldWeather);
router.post("/:fieldId/soil", authenticate, getFieldSoil);

export default router;
