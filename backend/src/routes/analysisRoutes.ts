import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { getFieldWeather } from "../controllers/weatherController";
import { getCropSuitability } from "../controllers/cropController";
import {
  getFieldSoil,
  getFieldSoilHistory,
} from "../controllers/soilController";
import { getIrrigationPlan } from "../controllers/irrigationController";
import { getFieldNDVI } from "../controllers/ndviController";
import { getFertilizerPlan } from "../controllers/fertilizerController";
import { getRiskAlerts } from "../controllers/riskController";
import { getPesticideRecommendation } from "../controllers/pesticideController";

const router = Router();

router.post("/:fieldId/weather", authenticate, getFieldWeather);
router.post("/:fieldId/soil", authenticate, getFieldSoil);
router.get("/:fieldId/soil/history", authenticate, getFieldSoilHistory);
router.post("/:fieldId/crop", authenticate, getCropSuitability);
router.post("/:fieldId/irrigation", authenticate, getIrrigationPlan);
router.post("/:fieldId/ndvi", authenticate, getFieldNDVI);
router.post("/:fieldId/fertilizer", authenticate, getFertilizerPlan);
router.post("/:fieldId/risks", authenticate, getRiskAlerts);
router.post("/:fieldId/pesticide", authenticate, getPesticideRecommendation);

export default router;
