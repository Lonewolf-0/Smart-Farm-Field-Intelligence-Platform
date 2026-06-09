import request from "supertest";
import express from "express";
import analysisRoutes from "../../src/routes/analysisRoutes";
import * as fieldRepo from "../../src/repositories/fieldRepository";
import * as weatherService from "../../src/services/weatherService";
import * as nasaPowerService from "../../src/services/nasaPowerService";
import * as irrigationService from "../../src/services/irrigationService";
import { getIrrigationPlan } from "../../src/controllers/irrigationController";
import { pool } from "../../src/config/db";

let mockUser: any = { id: "user1" };

jest.mock("../../src/middlewares/authMiddleware", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

const app = express();
app.use(express.json());
app.use("/api/analysis", analysisRoutes);

describe("Irrigation API Integration Tests", () => {
  const mockField = {
    id: "field1",
    user_id: "user1",
    centroid_lat: 10,
    centroid_lng: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "user1" };
  });

  describe("POST /api/analysis/:fieldId/irrigation", () => {
    it("should return 401 if user is unauthorized", async () => {
      mockUser = null;

      const res = await request(app).post("/api/analysis/field1/irrigation");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should return 404 if field not found", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(null);

      const res = await request(app).post("/api/analysis/field1/irrigation");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Field not found");
      expect(fieldRepo.findFieldById).toHaveBeenCalledWith("field1");
    });

    it("should return 403 if user does not own field", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce({
        ...mockField,
        user_id: "otherUser",
      } as any);

      const res = await request(app).post("/api/analysis/field1/irrigation");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Forbidden");
    });

    it("should return 400 if no soil data exists", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).post("/api/analysis/field1/irrigation");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Missing soil data");
    });

    it("should return 400 if soil layers are missing", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ data: {} }],
      });

      const res = await request(app).post("/api/analysis/field1/irrigation");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Missing soil data");
    });

    it("should return 400 if soil texture is missing", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ data: { layers: [{}] } }],
      });

      const res = await request(app).post("/api/analysis/field1/irrigation");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Missing soil texture data");
    });

    it("should calculate and return irrigation plan successfully", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ data: { layers: [{ texture: "Clay" }] } }],
      });

      const mockWeather = { temp: 25, humidity: 60 };
      const mockNasa = [{ date: "20260609", rain: 0 }];
      const mockPlan = {
        nextIrrigationDays: 2,
        waterAmountMm: 15.5,
      };

      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce(mockWeather as any);
      jest.spyOn(nasaPowerService, "getNasaPowerData").mockResolvedValueOnce(mockNasa as any);
      jest.spyOn(irrigationService, "calculateIrrigation").mockReturnValueOnce(mockPlan as any);

      const res = await request(app).post("/api/analysis/field1/irrigation");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockPlan);

      expect(weatherService.getWeatherData).toHaveBeenCalledWith(10, 20);
      expect(nasaPowerService.getNasaPowerData).toHaveBeenCalledWith(
        10,
        20,
        expect.any(String),
        expect.any(String)
      );
      expect(irrigationService.calculateIrrigation).toHaveBeenCalledWith(
        { texture: "Clay" },
        mockWeather,
        mockNasa
      );
    });

    it("should return 500 if an unexpected error occurs", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockRejectedValueOnce(new Error("Unexpected error"));

      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await request(app).post("/api/analysis/field1/irrigation");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Unexpected error");

      errSpy.mockRestore();
    });

    it("should return 400 if fieldId is missing in request params", async () => {
      const customApp = express();
      customApp.use(express.json());
      customApp.post("/api/analysis/:fieldId/irrigation", (req: any, res, next) => {
        req.user = { id: "user1" };
        req.params.fieldId = undefined;
        next();
      }, getIrrigationPlan);

      const res = await request(customApp).post("/api/analysis/undefined/irrigation");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Field ID required");
    });
  });
});
