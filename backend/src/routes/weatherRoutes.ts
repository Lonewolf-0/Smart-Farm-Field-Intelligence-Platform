import { Router } from "express";
import { getWeatherController } from "../controllers/weatherController";
const router = Router();

router.get("/", getWeatherController);

export default router;
