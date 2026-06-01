import { Router } from "express";
import {
  registerController,
  loginController,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  validateRegisterInput,
  validateLoginInput,
} from "../validations/auth.validation";
import { authenticate } from "../middlewares/auth.middleware";
const router = Router();

router.post(
  "/register",
  validate(validateRegisterInput), //validation applied here
  registerController,
);

router.post("/login", validate(validateLoginInput), loginController);

router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "You are authenticated",
    user: (req as any).user,
  });
});

export default router;
