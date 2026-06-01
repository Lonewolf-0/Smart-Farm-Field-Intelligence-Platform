import { Router } from "express";
import { registerController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { validateRegisterInput } from "../validations/auth.validation";

const router = Router();

router.post(
  "/register",
  validate(validateRegisterInput), //validation applied here
  registerController,
);

export default router;
