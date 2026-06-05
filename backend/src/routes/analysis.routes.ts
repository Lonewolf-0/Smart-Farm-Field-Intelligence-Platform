import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getFieldWeather } from "../controllers/weather.controller";
import { getCropSuitability } from "../controllers/crop.controller";
import {
  getFieldSoil,
  getFieldSoilHistory,
} from "../controllers/soil.controller";
import { getIrrigationPlan } from "../controllers/irrigation.controller";
import { getFieldNDVI } from "../controllers/ndviController";
import { getFertilizerPlan } from "../controllers/fertilizerController";
import { getPesticideRecommendation } from "../controllers/pesticideController";

const router = Router();

router.post("/:fieldId/weather", authenticate, getFieldWeather);
router.post("/:fieldId/soil", authenticate, getFieldSoil);
router.get("/:fieldId/soil/history", authenticate, getFieldSoilHistory);
router.post("/:fieldId/crop", authenticate, getCropSuitability);
router.post("/:fieldId/irrigation", authenticate, getIrrigationPlan);
router.post("/:fieldId/ndvi", authenticate, getFieldNDVI);
router.post("/:fieldId/fertilizer", authenticate, getFertilizerPlan);
router.post("/:fieldId/pesticide", authenticate, getPesticideRecommendation);

export default router;
