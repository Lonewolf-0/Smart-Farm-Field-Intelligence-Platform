import request from "supertest";
import express from "express";

jest.mock("../../src/repositories/fieldRepository", () => ({
  findFieldById: jest.fn(),
}));

jest.mock("../../src/services/soilService", () => ({
  getSoilProperties: jest.fn(),
}));

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

import {
  getFieldSoilHistory,
  getFieldSoil,
} from "../../src/controllers/soilController";

import { findFieldById } from "../../src/repositories/fieldRepository";
import { getSoilProperties } from "../../src/services/soilService";
import { pool } from "../../src/config/db";

describe("Soil Controller - FINAL 100%", () => {
  const createApp = (user?: any) => {
    const app = express();
    app.use(express.json());

    app.get("/history/:fieldId", (req: any, res) => {
      req.user = user;
      return getFieldSoilHistory(req, res);
    });

    app.get("/soil/:fieldId", (req: any, res) => {
      req.user = user;
      return getFieldSoil(req, res);
    });

    return app;
  };

  const mockField = {
    id: "field1",
    user_id: "user1",
    centroid_lat: 10,
    centroid_lng: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //Base validations

  it("should return 401 if user missing", async () => {
    const res = await request(createApp()).get("/history/field1");
    expect(res.status).toBe(401);
  });

  it("should return 404 if field not found", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(null);

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.status).toBe(404);
  });

  it("should return 403 if not owner", async () => {
    (findFieldById as jest.Mock).mockResolvedValue({
      ...mockField,
      user_id: "other",
    });

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.status).toBe(403);
  });

  //core alert logic

  it("should execute ALL inner branches (no alerts case)", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

    //  Forces:
    // - newestTop && oldestTop = true
    // - all thresholds = FALSE
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          year: 2025,
          data: { layers: [{ ph: 7, organicCarbon: 10, nitrogen: 30 }] },
        },
        {
          year: 2024, // difference small
          data: { layers: [{ ph: 7, organicCarbon: 10, nitrogen: 30 }] },
        },
      ],
    });

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.body.data.alerts).toEqual([]);
  });

  // FORCE ALL ALERTS
  it("should trigger ALL alerts", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          year: 2025,
          data: {
            layers: [
              {
                ph: 5,
                organicCarbon: -10, //  big drop ensures OC branch
                nitrogen: 10,
              },
            ],
          },
        },
        {
          year: 2020,
          data: {
            layers: [
              {
                ph: 7,
                organicCarbon: 10,
                nitrogen: 40,
              },
            ],
          },
        },
      ],
    });

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.body.data.alerts.length).toBe(3);
  });

  // FORCE missing layers
  it("should skip when layers missing", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        { year: 2025, data: {} },
        { year: 2020, data: {} },
      ],
    });

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.body.data.alerts).toEqual([]);
  });

  //  FORCE null values branch
  it("should skip when values are null", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          year: 2025,
          data: {
            layers: [{ ph: null, organicCarbon: null, nitrogen: null }],
          },
        },
        {
          year: 2020,
          data: {
            layers: [{ ph: null, organicCarbon: null, nitrogen: null }],
          },
        },
      ],
    });

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.body.data.alerts).toEqual([]);
  });

  //error

  it("should return 500 on error", async () => {
    (findFieldById as jest.Mock).mockRejectedValue(new Error("fail"));

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.status).toBe(500);

    spy.mockRestore();
  });

  it("should return Kharif", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-06-01"));

    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockResolvedValue({ layers: [] });
    (pool.query as jest.Mock).mockResolvedValue({});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.body.data.season).toBe("Kharif");

    jest.useRealTimers();
  });

  it("should return Kharif preparation", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-01"));

    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockResolvedValue({ layers: [] });
    (pool.query as jest.Mock).mockResolvedValue({});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.body.data.season).toBe("Kharif preparation");

    jest.useRealTimers();
  });

  it("should return Rabi preparation ✅ FIX", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-01")); // ✅ October

    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockResolvedValue({ layers: [] });
    (pool.query as jest.Mock).mockResolvedValue({});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.body.data.season).toBe("Rabi preparation");

    jest.useRealTimers();
  });

  it("should return Rabi", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01"));

    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockResolvedValue({ layers: [] });
    (pool.query as jest.Mock).mockResolvedValue({});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.body.data.season).toBe("Rabi");

    jest.useRealTimers();
  });

  // error path
  it("should handle soil API error", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockRejectedValue(new Error("fail"));

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.status).toBe(500);

    spy.mockRestore();
  });
});
