import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { saveField, getUserFields } from "../controllers/field.controller";

const router = Router();

// Get user fields
router.get("/", authenticate, getUserFields);

// Save field
router.post("/", authenticate, saveField);

export default router;
