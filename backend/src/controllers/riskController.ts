import { Response } from "express";
import { AuthRequest } from "../types";
import { sendResponse } from "../utils/response";

import { getRiskAnalysisService } from "../services/riskAnalysisService";

// API CONTROLLER
export const getRiskAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;

    const userId = req.user!.id;

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

export const streamRiskAlerts = async (req: AuthRequest, res: Response) => {
  const { fieldId } = req.params;

  if (!req.user?.id) {
    res.status(401).end();
    return;
  }

  const userId = req.user.id;

  //  SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify({ message: "connected" })}\n\n`);

  const interval = setInterval(async () => {
    try {
      const risks = await getRiskAnalysisService(userId, fieldId);

      const highRisks = risks.filter(
        (r) => r.severity === "high" || r.severity === "critical",
      );

      if (highRisks.length > 0) {
        res.write(`data: ${JSON.stringify(highRisks)}\n\n`);
      }
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: "failed" })}\n\n`);
    }
  }, 10000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
};
