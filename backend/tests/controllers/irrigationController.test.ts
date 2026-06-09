import request from "supertest";
import express from "express";

jest.mock("../../src/repositories/fieldRepository", () => ({
  findFieldById: jest.fn(),
}));

jest.mock("../../src/services/weatherService", () => ({
  getWeatherData: jest.fn(),
}));

jest.mock("../../src/services/nasaPowerService", () => ({
  getNasaPowerData: jest.fn(),
}));

jest.mock("../../src/services/irrigationService", () => ({
  calculateIrrigation: jest.fn(),
}));

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

import { getIrrigationPlan } from "../../src/controllers/irrigationController";
import { findFieldById } from "../../src/repositories/fieldRepository";
import { pool } from "../../src/config/db";
import { getWeatherData } from "../../src/services/weatherService";
import { getNasaPowerData } from "../../src/services/nasaPowerService";
import { calculateIrrigation } from "../../src/services/irrigationService";

describe("Irrigation Controller", () => {
  const createApp = (user?: any) => {
    const app = express();
    app.use(express.json());

    app.get("/irrigation/:fieldId", (req: any, res) => {
      req.user = user; // ✅ inject user
      return getIrrigationPlan(req, res);
    });

    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockField = {
    id: "field1",
    user_id: "user1",
    centroid_lat: 10,
    centroid_lng: 20,
  };

  //unauthorized
  it("should return 401 if user missing", async () => {
    const app = createApp(undefined);

    const res = await request(app).get("/irrigation/field1");

    expect(res.status).toBe(401);
  });

  //fieldId is missing
  it("should return 400 if fieldId missing", async () => {
    const app = createApp({ id: "user1" });

    const res = await request(app).get("/irrigation/");

    expect(res.status).toBe(404); // express route fallback
  });

  //field not found
  it("should return 404 if field not found", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(null);

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/irrigation/field1");

    expect(res.status).toBe(404);
  });

  //forbidden
  it("should return 403 if field not owned", async () => {
    (findFieldById as jest.Mock).mockResolvedValue({
      ...mockField,
      user_id: "other",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/irrigation/field1");

    expect(res.status).toBe(403);
  });

  // No soil data
  it("should return 400 if no soil data", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/irrigation/field1");

    expect(res.status).toBe(400);
  });

  //Missing layers
  it("should return 400 if soil layers missing", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ data: {} }],
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/irrigation/field1");

    expect(res.status).toBe(400);
  });

  //Missing texture
  it("should return 400 if texture missing", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ data: { layers: [{}] } }],
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/irrigation/field1");

    expect(res.status).toBe(400);
  });

  //Success flow
  it("should return irrigation plan successfully", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          data: {
            layers: [{ texture: "loam" }],
          },
        },
      ],
    });

    (getWeatherData as jest.Mock).mockResolvedValue({});
    (getNasaPowerData as jest.Mock).mockResolvedValue([]);
    (calculateIrrigation as jest.Mock).mockReturnValue({
      nextIrrigationDays: 3,
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/irrigation/field1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(getWeatherData).toHaveBeenCalledWith(10, 20);
    expect(calculateIrrigation).toHaveBeenCalled();
  });

  //Error Handling
  it("should return 500 on unexpected error", async () => {
    (findFieldById as jest.Mock).mockRejectedValue(new Error("DB FAIL"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/irrigation/field1");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should return 400 when fieldId is missing inside controller", async () => {
    const app = express();
    app.use(express.json());

    app.get("/irrigation/:fieldId", (req: any, res) => {
      req.user = { id: "user1" };

      // FORCE missing fieldId
      req.params.fieldId = undefined;

      return getIrrigationPlan(req, res);
    });

    const res = await request(app).get("/irrigation/dummy");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Field ID required");
    expect(res.body.error).toBe("Field ID required");
  });
  ``;
});
