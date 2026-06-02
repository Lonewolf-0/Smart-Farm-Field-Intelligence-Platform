import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { saveField, getUserFields, deleteUserField } from "../controllers/field.controller";

const router = Router();

// Get user fields
router.get("/", authenticate, getUserFields);

// Save field
router.post("/", authenticate, saveField);

// Delete field
router.delete("/:id", authenticate, deleteUserField);

export default router;
