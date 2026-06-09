import request from "supertest";
import express from "express";
import analysisRoutes from "../../src/routes/analysisRoutes";
import * as riskAnalysisService from "../../src/services/riskAnalysisService";

let mockUser: any = { id: "user1" };

jest.mock("../../src/middlewares/authMiddleware", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

const app = express();
app.use(express.json());
app.use("/api/analysis", analysisRoutes);

describe("Risk API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "user1" };
  });

  describe("POST /api/analysis/:fieldId/risks", () => {
    it("should return 200 with risk data", async () => {
      const mockRisks = [{ risk: "High" }];
      jest.spyOn(riskAnalysisService, "getRiskAnalysisService").mockResolvedValueOnce(mockRisks as any);

      const res = await request(app).post("/api/analysis/1/risks");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRisks);
      expect(riskAnalysisService.getRiskAnalysisService).toHaveBeenCalledWith("user1", "1");
    });

    it("should handle custom error with status, message, and code", async () => {
      jest.spyOn(riskAnalysisService, "getRiskAnalysisService").mockRejectedValueOnce({
        status: 403,
        message: "Forbidden",
        code: "FIELD_ACCESS_DENIED",
      });

      const res = await request(app).post("/api/analysis/1/risks");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Forbidden");
      expect(res.body.error).toBe("FIELD_ACCESS_DENIED");
    });

    it("should fallback to 500 if status is missing", async () => {
      jest.spyOn(riskAnalysisService, "getRiskAnalysisService").mockRejectedValueOnce({
        message: "Something failed",
      });

      const res = await request(app).post("/api/analysis/1/risks");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Something failed");
      expect(res.body.error).toBe("Something failed");
    });

    it("should fallback to default error message", async () => {
      jest.spyOn(riskAnalysisService, "getRiskAnalysisService").mockRejectedValueOnce({});

      const res = await request(app).post("/api/analysis/1/risks");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Risk analysis failed");
      expect(res.body.error).toBeUndefined();
    });

    it("should fallback error to message when code missing", async () => {
      jest.spyOn(riskAnalysisService, "getRiskAnalysisService").mockRejectedValueOnce({
        status: 400,
        message: "Bad request",
      });

      const res = await request(app).post("/api/analysis/1/risks");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Bad request");
    });
  });
});
