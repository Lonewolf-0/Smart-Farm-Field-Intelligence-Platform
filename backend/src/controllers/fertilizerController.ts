import { Response } from "express";
import { AuthRequest } from "../types";
import { sendResponse } from "../utils/response";

import { getFertilizerService } from "../services/fertilizerService";

export const getFertilizerPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?.id as string;

    const result = await getFertilizerService(userId, fieldId, req.body);

    return sendResponse(res, 200, "Fertilizer plan calculated", result);
  } catch (error: any) {
    return sendResponse(
      res,
      error.status || 500,
      error.message || "Failed to calculate fertilizer",
      null,
      error.code || error.message,
    );
  }
};
