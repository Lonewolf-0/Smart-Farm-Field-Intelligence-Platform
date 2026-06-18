import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/authService";
import { sendResponse } from "../utils/response";
import { AuthRequest } from "../types";
import logger from "../utils/logger";

export const registerController = async (req: Request, res: Response) => {
  try {
    const result = await registerUser(req.body);

    return sendResponse(res, 201, "User registered successfully", result);
  } catch (error: any) {
    if (error.message === "EMAIL_ALREADY_EXISTS") {
      return sendResponse(
        res,
        400,
        "Email already exists",
        null,
        error.message,
      );
    }

    logger.error(error);

    return sendResponse(res, 500, "Internal server error", null, error.message);
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return sendResponse(res, 401, "Unauthorized", null, "Missing user");
    }

    return sendResponse(res, 200, "Current user", user);
  } catch (error: any) {
    return sendResponse(res, 500, "Internal server error", null, error.message);
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const result = await loginUser(req.body);
    return sendResponse(res, 200, "Login successful", result);
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return sendResponse(res, 401, "Invalid Email", null, error.message);
    }
    if (error.message === "INVALID_PASSWORD") {
      return sendResponse(res, 401, "Invalid Password", null, error.message);
    }
    logger.error(error);
    return sendResponse(res, 500, "Internal server error", null, error.message);
  }
};
