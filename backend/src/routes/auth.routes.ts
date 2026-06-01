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

const router = Router();

router.post(
  "/register",
  validate(validateRegisterInput), //validation applied here
  registerController,
);

router.post("/login", validate(validateLoginInput), loginController);

export default router;
