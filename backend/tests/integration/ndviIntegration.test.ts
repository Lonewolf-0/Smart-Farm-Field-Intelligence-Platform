import request from "supertest";
import express from "express";
import analysisRoutes from "../../src/routes/analysisRoutes";
import * as ndviService from "../../src/services/ndviService";
import { pool } from "../../src/config/db";

let mockUser: any = { id: "user1" };

jest.mock("../../src/middlewares/authMiddleware", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    if (mockUser) {
      req.user = mockUser;
    } else {
      return _res.status(401).json({ success: false, error: "Unauthorized" });
    }
    next();
  },
}));

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

const app = express();
app.use(express.json());
app.use("/api/analysis", analysisRoutes);

describe("NDVI API Integration Tests", () => {
  const mockPolygon = {
    type: "Polygon",
    coordinates: [[[20.0, 10.0], [20.1, 10.0], [20.1, 10.1], [20.0, 10.1], [20.0, 10.0]]],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "user1" };
  });

  describe("POST /api/analysis/:fieldId/ndvi", () => {
    it("should return 401 if user is unauthorized", async () => {
      mockUser = null;

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should return 401 if req.user is missing id", async () => {
      mockUser = {};

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should return 404 if field not found", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Field not found");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, polygon FROM fields WHERE id = $1 AND user_id = $2"),
        ["field1", "user1"]
      );
    });

    it("should retrieve NDVI data successfully when Sentinel Hub service works", async () => {
      const mockField = {
        id: "field1",
        polygon: mockPolygon,
      };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockField] });

      const mockNDVIData = {
        averageNDVI: 0.75,
        healthScore: 100,
        stressZones: [5.2, 94.8],
        timestamp: "2026-06-09T00:00:00.000Z",
      };

      jest.spyOn(ndviService, "getNDVIData").mockResolvedValueOnce(mockNDVIData);

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        averageNDVI: 0.75,
        healthScore: "Excellent",
        healthPercentage: 100,
        stressAreas: 5.2,
        lastImageDate: "2026-06-09T00:00:00.000Z",
      });
      expect(ndviService.getNDVIData).toHaveBeenCalledWith(mockPolygon);
    });

    it("should retrieve NDVI data with moderate score when averageNDVI is between 0.3 and 0.5", async () => {
      const mockField = {
        id: "field1",
        polygon: JSON.stringify(mockPolygon),
      };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockField] });

      const mockNDVIData = {
        averageNDVI: 0.45,
        healthScore: 50,
        stressZones: [15.0, 60.0],
        timestamp: "2026-06-09T00:00:00.000Z",
      };

      jest.spyOn(ndviService, "getNDVIData").mockResolvedValueOnce(mockNDVIData);

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        averageNDVI: 0.45,
        healthScore: "Moderate",
        healthPercentage: 50,
        stressAreas: 15.0,
        lastImageDate: "2026-06-09T00:00:00.000Z",
      });
    });

    it("should retrieve NDVI data with Good score when averageNDVI is between 0.5 and 0.7", async () => {
      const mockField = {
        id: "field1",
        polygon: mockPolygon,
      };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockField] });

      const mockNDVIData = {
        averageNDVI: 0.6,
        healthScore: 80,
        stressZones: [8.0, 80.0],
        timestamp: "2026-06-09T00:00:00.000Z",
      };

      jest.spyOn(ndviService, "getNDVIData").mockResolvedValueOnce(mockNDVIData);

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.healthScore).toBe("Good");
    });

    it("should retrieve NDVI data with Poor score when averageNDVI is 0.3 or below", async () => {
      const mockField = {
        id: "field1",
        polygon: mockPolygon,
      };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockField] });

      const mockNDVIData = {
        averageNDVI: 0.2,
        healthScore: 20,
        stressZones: [50.0, 10.0],
        timestamp: "2026-06-09T00:00:00.000Z",
      };

      jest.spyOn(ndviService, "getNDVIData").mockResolvedValueOnce(mockNDVIData);

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.healthScore).toBe("Poor");
    });

    it("should fallback to mock data when Sentinel Hub service fails", async () => {
      const mockField = {
        id: "field1",
        polygon: mockPolygon,
      };
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockField] });

      jest.spyOn(ndviService, "getNDVIData").mockRejectedValueOnce(new Error("Sentinel Hub API Error"));

      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.averageNDVI).toBe(0.65);
      expect(res.body.data.healthScore).toBe("Good");
      expect(res.body.data.healthPercentage).toBe(80);
      expect(res.body.data.stressAreas).toBe(15.5);
      expect(res.body.data.lastImageDate).toBeDefined();
      expect(res.body.data.warning).toContain("Mock data used");

      warnSpy.mockRestore();
    });

    it("should return 500 if database query fails", async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error("Database error"));

      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await request(app).post("/api/analysis/field1/ndvi");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Internal server error");

      errorSpy.mockRestore();
    });
  });
});
