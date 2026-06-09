import request from "supertest";
import express from "express";
import analysisRoutes from "../../src/routes/analysisRoutes";
import * as cropService from "../../src/services/cropService";

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

describe("Crop API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "user1" };
  });

  describe("POST /api/analysis/:fieldId/crop", () => {
    it("should return crop recommendations successfully", async () => {
      const mockCrops = [{ name: "Wheat", score: 90 }];
      jest.spyOn(cropService, "getCropSuitabilityService").mockResolvedValueOnce(mockCrops as any);

      const res = await request(app).post("/api/analysis/1/crop");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockCrops);
      expect(cropService.getCropSuitabilityService).toHaveBeenCalledWith("user1", "1");
    });

    it("should return 404 if field not found", async () => {
      jest.spyOn(cropService, "getCropSuitabilityService").mockRejectedValueOnce({
        status: 404,
        message: "Field not found",
      });

      const res = await request(app).post("/api/analysis/1/crop");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Field not found");
    });

    it("should return 403 if user is forbidden to access field", async () => {
      jest.spyOn(cropService, "getCropSuitabilityService").mockRejectedValueOnce({
        status: 403,
        message: "Forbidden",
        code: "FIELD_ACCESS_DENIED",
      });

      const res = await request(app).post("/api/analysis/1/crop");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("FIELD_ACCESS_DENIED");
    });

    it("should return 400 if soil data is missing", async () => {
      jest.spyOn(cropService, "getCropSuitabilityService").mockRejectedValueOnce({
        status: 400,
        message: "Run soil analysis first",
      });

      const res = await request(app).post("/api/analysis/1/crop");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Run soil analysis first");
    });

    it("should return 500 if an unexpected error occurs", async () => {
      jest.spyOn(cropService, "getCropSuitabilityService").mockRejectedValueOnce(new Error("Unexpected error"));

      const res = await request(app).post("/api/analysis/1/crop");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it("should handle empty error object by falling back to default status and messages", async () => {
      jest.spyOn(cropService, "getCropSuitabilityService").mockRejectedValueOnce({});

      const res = await request(app).post("/api/analysis/1/crop");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Failed to fetch crop recommendations");
    });

    it("should handle missing user on request gracefully", async () => {
      mockUser = undefined;
      jest.spyOn(cropService, "getCropSuitabilityService").mockResolvedValueOnce([]);

      const res = await request(app).post("/api/analysis/1/crop");

      expect(res.status).toBe(200);
      expect(cropService.getCropSuitabilityService).toHaveBeenCalledWith(undefined, "1");
    });
  });
});
