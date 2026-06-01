import { Request, Response } from "express";
import { registerUser } from "../services/auth.service";
import { sendResponse } from "../utils/response";

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

    console.error(error);

    return sendResponse(res, 500, "Internal server error", null, error.message);
  }
};
