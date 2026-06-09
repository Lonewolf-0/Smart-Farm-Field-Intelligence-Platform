import request from "supertest";
import express from "express";

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

jest.mock("../../src/services/ndviService", () => ({
  getNDVIData: jest.fn(),
}));

import { getFieldNDVI } from "../../src/controllers/ndviController";
import { pool } from "../../src/config/db";
import { getNDVIData } from "../../src/services/ndviService";

describe("NDVI Controller", () => {
  const createApp = (user?: any) => {
    const app = express();
    app.use(express.json());

    app.get("/ndvi/:fieldId", (req: any, res) => {
      req.user = user;
      return getFieldNDVI(req, res);
    });

    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockField = {
    id: "field1",
    polygon: { type: "Polygon" },
  };

  //unauthorized
  it("should return 401 when user missing", async () => {
    const app = createApp(undefined);

    const res = await request(app).get("/ndvi/field1");

    expect(res.status).toBe(401);
  });

  //field not found
  it("should return 404 when field not found", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/ndvi/field1");

    expect(res.status).toBe(404);
  });

  //success path
  it("should return NDVI data successfully (Excellent)", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        { polygon: JSON.stringify(mockField.polygon) }, // ✅ string polygon
      ],
    });

    (getNDVIData as jest.Mock).mockResolvedValue({
      averageNDVI: 0.75,
      healthScore: 90,
      stressZones: [10],
      timestamp: "2024-01-01",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/ndvi/field1");

    expect(res.status).toBe(200);
    expect(res.body.data.healthScore).toBe("Excellent");
  });

  //good health
  it("should return Good health classification", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ polygon: mockField.polygon }], // ✅ object polygon
    });

    (getNDVIData as jest.Mock).mockResolvedValue({
      averageNDVI: 0.6,
      healthScore: 80,
      stressZones: [5],
      timestamp: "2024-01-01",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/ndvi/field1");

    expect(res.body.data.healthScore).toBe("Good");
  });

  //moderate health
  it("should return Moderate health classification", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ polygon: mockField.polygon }],
    });

    (getNDVIData as jest.Mock).mockResolvedValue({
      averageNDVI: 0.4,
      healthScore: 50,
      stressZones: [20],
      timestamp: "2024-01-01",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/ndvi/field1");

    expect(res.body.data.healthScore).toBe("Moderate");
  });

  //poor health
  it("should return Poor health classification", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ polygon: mockField.polygon }],
    });

    (getNDVIData as jest.Mock).mockResolvedValue({
      averageNDVI: 0.2,
      healthScore: 20,
      stressZones: [40],
      timestamp: "2024-01-01",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/ndvi/field1");

    expect(res.body.data.healthScore).toBe("Poor");
  });

  //NDVI service fail
  it("should return mock data when NDVI service fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ polygon: mockField.polygon }],
    });

    (getNDVIData as jest.Mock).mockRejectedValue(new Error("NDVI error"));

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/ndvi/field1");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Mock data used");
    expect(res.body.data.warning).toBeDefined();

    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  //   outer catch block
  it("should return 500 on unexpected error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (pool.query as jest.Mock).mockRejectedValue(new Error("DB ERROR"));

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/ndvi/field1");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
