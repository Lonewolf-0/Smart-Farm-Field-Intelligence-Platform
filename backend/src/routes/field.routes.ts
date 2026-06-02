import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { saveField } from "../controllers/field.controller";

const router = Router();

// Save field
router.post("/", authenticate, saveField);

export default router;
