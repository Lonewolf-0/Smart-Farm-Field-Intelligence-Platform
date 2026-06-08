import { Router } from "express";
import {
  registerController,
  loginController,
  getMe,
} from "../controllers/authController";
import { validate } from "../middlewares/validateMiddleware";
import {
  validateRegisterInput,
  validateLoginInput,
} from "../validations/authValidation";
import { authenticate } from "../middlewares/authMiddleware";
const router = Router();

router.post(
  "/register",
  validate(validateRegisterInput), //validation applied here
  registerController,
);

router.post("/login", validate(validateLoginInput), loginController);

// Protected test endpoint
router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: (req as any).user,
  });
});

// GET /api/auth/me - return current user (attached by auth middleware)
router.get("/me", authenticate, getMe);

export default router;
