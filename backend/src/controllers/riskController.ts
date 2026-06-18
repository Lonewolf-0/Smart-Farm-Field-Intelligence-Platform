import { Response } from "express";
import { AuthRequest } from "../types";
import { sendResponse } from "../utils/response";

import { getRiskAnalysisService } from "../services/riskAnalysisService";

// Cache for risk analysis data
// Key: `${userId}_${fieldId}`
const riskCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

  let lastSentData = "";

  const interval = setInterval(async () => {
    try {
      const cacheKey = `${userId}_${fieldId}`;
      const now = Date.now();
      let risks;

      const cached = riskCache.get(cacheKey);
      if (cached && cached.expiry > now) {
        risks = cached.data;
      } else {
        risks = await getRiskAnalysisService(userId, fieldId);
        riskCache.set(cacheKey, { data: risks, expiry: now + CACHE_TTL });
      }

      const highRisks = risks.filter(
        (r: any) => r.severity === "high" || r.severity === "critical",
      );

      if (highRisks.length > 0) {
        const newData = JSON.stringify(highRisks);
        if (newData !== lastSentData) {
          res.write(`data: ${newData}\n\n`);
          lastSentData = newData;
        }
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
