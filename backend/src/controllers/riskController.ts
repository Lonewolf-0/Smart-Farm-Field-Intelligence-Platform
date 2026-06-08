import { Response } from "express";
import { AuthRequest } from "../types";
import { sendResponse } from "../utils/response";

import { getRiskAnalysisService } from "../services/riskAnalysisService";

export const getRiskAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?.id as string;

    const risks = await getRiskAnalysisService(userId, fieldId);
    return sendResponse(res, 200, "Risk analysis completed", risks);
  } catch (error: any) {
    return sendResponse(
      res,
      error.status || 500,
      error.message || "Risk analysis failed",
      null,
      error.code || error.message,
    );
  }
};
