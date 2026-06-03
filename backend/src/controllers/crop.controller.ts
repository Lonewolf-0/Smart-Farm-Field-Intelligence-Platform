import { Response } from "express";
import { AuthRequest } from "../types";
import { sendResponse } from "../utils/response";

import { getCropSuitabilityService } from "../services/crop.service";
export const getCropSuitability = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?.id as string;

    const crops = await getCropSuitabilityService(userId, fieldId);

    return sendResponse(res, 200, "Crop recommendation fetched", crops);
  } catch (error: any) {
    return sendResponse(
      res,
      error.status || 500,
      error.message || "Failed to fetch crop recommendations",
      null,
      error.code || error.message,
    );
  }
};
