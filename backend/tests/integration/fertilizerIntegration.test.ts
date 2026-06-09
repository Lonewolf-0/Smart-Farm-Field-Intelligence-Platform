import request from "supertest";
import express from "express";
import analysisRoutes from "../../src/routes/analysisRoutes";
import * as fertilizerService from "../../src/services/fertilizerService";

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

describe("Fertilizer API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "user1" };
  });

  describe("POST /api/analysis/:fieldId/fertilizer", () => {
    it("should return the calculated fertilizer plan successfully", async () => {
      const mockPlan = { crop: "Wheat", recommendations: [], totalQuantity: 0 };
      jest.spyOn(fertilizerService, "getFertilizerService").mockResolvedValueOnce(mockPlan as any);

      const res = await request(app)
        .post("/api/analysis/1/fertilizer")
        .send({ crop: "Wheat" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockPlan);
      expect(fertilizerService.getFertilizerService).toHaveBeenCalledWith("user1", "1", { crop: "Wheat" });
    });

    it("should return 404 status when field is not found", async () => {
      jest.spyOn(fertilizerService, "getFertilizerService").mockRejectedValueOnce({
        status: 404,
        message: "Field not found",
      });

      const res = await request(app)
        .post("/api/analysis/1/fertilizer")
        .send({ crop: "Wheat" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Field not found");
    });

    it("should return 403 status when access is forbidden", async () => {
      jest.spyOn(fertilizerService, "getFertilizerService").mockRejectedValueOnce({
        status: 403,
        message: "Forbidden",
        code: "FIELD_ACCESS_DENIED",
      });

      const res = await request(app)
        .post("/api/analysis/1/fertilizer")
        .send({ crop: "Wheat" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("FIELD_ACCESS_DENIED");
    });

    it("should handle generic errors and fallback to 500 status", async () => {
      jest.spyOn(fertilizerService, "getFertilizerService").mockRejectedValueOnce(new Error("Database crash"));

      const res = await request(app)
        .post("/api/analysis/1/fertilizer")
        .send({ crop: "Wheat" });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Database crash");
    });

    it("should handle empty error object by falling back to default status and messages", async () => {
      jest.spyOn(fertilizerService, "getFertilizerService").mockRejectedValueOnce({});

      const res = await request(app)
        .post("/api/analysis/1/fertilizer")
        .send({ crop: "Wheat" });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Failed to calculate fertilizer");
      expect(res.body.error).toBeUndefined();
    });
  });
});
