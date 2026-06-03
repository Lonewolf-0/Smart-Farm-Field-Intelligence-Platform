import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getFieldWeather } from "../controllers/weather.controller";
import {
  getFieldSoil,
  getFieldSoilHistory,
} from "../controllers/soil.controller";
import { getCropSuitability } from "../controllers/crop.controller";

const router = Router();

router.post("/:fieldId/weather", authenticate, getFieldWeather);
router.post("/:fieldId/soil", authenticate, getFieldSoil);
router.get("/:fieldId/soil/history", authenticate, getFieldSoilHistory);
router.post("/:fieldId/crop", authenticate, getCropSuitability);

export default router;
