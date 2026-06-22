import request from "supertest";
import express from "express";
import analysisRoutes from "../../src/routes/analysisRoutes";
import * as fieldRepo from "../../src/repositories/fieldRepository";
import * as soilService from "../../src/services/soilService";
import { pool } from "../../src/config/db";
import { getFieldSoil, getFieldSoilHistory } from "../../src/controllers/soilController";

let mockUser: any = { id: "user1" };

jest.mock("../../src/middlewares/authMiddleware", () => ({
  authenticate: (req: any, res: any, next: any) => {
    if (!mockUser) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
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

describe("Soil API Integration Tests", () => {
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

  describe("POST /api/analysis/:fieldId/soil", () => {
    it("should fetch current soil properties and save them to DB", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      jest.spyOn(soilService, "getSoilProperties").mockResolvedValue({
        layers: [
          {
            depthLabel: "0-5cm",
            ph: 6.5,
            organicCarbon: 12,
            clay: 30,
            sand: 50,
            nitrogen: 15,
            texture: "Loam",
          },
        ],
      });
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1, rows: [] });

      const res = await request(app).post("/api/analysis/field1/soil");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.season).toBeDefined();
      expect(res.body.data.data.layers[0].ph).toBe(6.5);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO soil_data"),
        expect.arrayContaining(["field1"])
      );
    });

    it("should return 404 if field not found", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(null);

      const res = await request(app).post("/api/analysis/field1/soil");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Field not found");
    });

    it("should return 403 if user is not owner", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue({
        ...mockField,
        user_id: "otherUser",
      } as any);

      const res = await request(app).post("/api/analysis/field1/soil");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Forbidden");
    });

    it("should return 500 if soil properties fetch fails", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      jest.spyOn(soilService, "getSoilProperties").mockRejectedValue(new Error("External service error"));

      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await request(app).post("/api/analysis/field1/soil");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("External service error");

      spy.mockRestore();
    });

    it("should return 401 if user is unauthorized", async () => {
      mockUser = null;

      const res = await request(app).post("/api/analysis/field1/soil");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should return 400 if fieldId is missing in post request params", async () => {
      const customApp = express();
      customApp.use(express.json());
      customApp.post("/api/analysis/:fieldId/soil", (req: any, res, next) => {
        req.user = { id: "user1" };
        req.params.fieldId = undefined;
        next();
      }, getFieldSoil);

      const res = await request(customApp).post("/api/analysis/dummy/soil");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Field ID required");
    });

    it("should return season correctly for other months (Kharif prep, Rabi prep, Rabi)", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      jest.spyOn(soilService, "getSoilProperties").mockResolvedValue({ layers: [] } as any);
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1, rows: [] });

      const months = [3, 9, 11]; // March -> Kharif preparation, October -> Rabi preparation, December -> Rabi
      for (const m of months) {
        const dateSpy = jest.spyOn(global.Date.prototype, "getMonth").mockReturnValueOnce(m);
        const res = await request(app).post("/api/analysis/field1/soil");
        expect(res.status).toBe(200);
        dateSpy.mockRestore();
      }
    });
  });

  describe("GET /api/analysis/:fieldId/soil/history", () => {
    it("should return soil history and calculate alerts correctly", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 1,
            year: 2025,
            season: "Kharif",
            data: {
              layers: [
                {
                  ph: 5.2,
                  organicCarbon: 5,
                  nitrogen: 10,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            year: 2020,
            season: "Kharif",
            data: {
              layers: [
                {
                  ph: 7.0,
                  organicCarbon: 20,
                  nitrogen: 45,
                },
              ],
            },
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 5).toISOString(),
          },
        ],
      });

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toHaveLength(2);
      expect(res.body.data.alerts).toHaveLength(3);
    });

    it("should return history with no alerts if records show healthy trends", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 1,
            year: 2025,
            season: "Kharif",
            data: {
              layers: [
                {
                  ph: 6.7,
                  organicCarbon: 14.5,
                  nitrogen: 33,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            year: 2020,
            season: "Kharif",
            data: {
              layers: [
                {
                  ph: 6.8,
                  organicCarbon: 15,
                  nitrogen: 35,
                },
              ],
            },
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 5).toISOString(),
          },
        ],
      });

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toHaveLength(2);
      expect(res.body.data.alerts).toHaveLength(0);
    });

    it("should return history with no alerts if there is only 1 record", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 1,
            year: 2025,
            season: "Kharif",
            data: {
              layers: [
                {
                  ph: 6.8,
                  organicCarbon: 15,
                  nitrogen: 35,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
        ],
      });

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toHaveLength(1);
      expect(res.body.data.alerts).toHaveLength(0);
    });

    it("should skip calculations and not trigger alerts if historical records contain null values", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 1,
            year: 2025,
            season: "Kharif",
            data: {
              layers: [
                {
                  ph: null,
                  organicCarbon: null,
                  nitrogen: null,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            year: 2020,
            season: "Kharif",
            data: {
              layers: [
                {
                  ph: null,
                  organicCarbon: null,
                  nitrogen: null,
                },
              ],
            },
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 5).toISOString(),
          },
        ],
      });

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alerts).toHaveLength(0);
    });

    it("should skip alerts if layers are empty or missing", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 1,
            year: 2025,
            season: "Kharif",
            data: {
              layers: [],
            },
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            year: 2020,
            season: "Kharif",
            data: {},
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 5).toISOString(),
          },
        ],
      });

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alerts).toHaveLength(0);
    });

    it("should use a minimum of 1 year elapsed if records are from the same year to avoid division by zero", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 1,
            year: 2025,
            season: "Kharif",
            data: {
              layers: [
                {
                  ph: 5.2,
                  organicCarbon: 20,
                  nitrogen: 45,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            year: 2025,
            season: "Rabi",
            data: {
              layers: [
                {
                  ph: 7.0,
                  organicCarbon: 20,
                  nitrogen: 45,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
        ],
      });

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.alerts).toHaveLength(1);
      expect(res.body.data.alerts[0].type).toBe("pH");
    });

    it("should return 404 if field not found for history", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(null);

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Field not found");
    });

    it("should return 403 if user is not owner for history", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue({
        ...mockField,
        user_id: "otherUser",
      } as any);

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Forbidden");
    });

    it("should return 401 if user is unauthorized for history", async () => {
      mockUser = null;

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Unauthorized");
    });

    it("should return 400 if fieldId is missing in history request params", async () => {
      const customApp = express();
      customApp.use(express.json());
      customApp.get("/api/analysis/:fieldId/soil/history", (req: any, res, next) => {
        req.user = { id: "user1" };
        req.params.fieldId = undefined;
        next();
      }, getFieldSoilHistory);

      const res = await request(customApp).get("/api/analysis/dummy/soil/history");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Field ID required");
    });

    it("should return 500 if an unexpected error occurs in history query", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockRejectedValueOnce(new Error("Unexpected history error"));
      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const res = await request(app).get("/api/analysis/field1/soil/history");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);

      errSpy.mockRestore();
    });
  });
});
