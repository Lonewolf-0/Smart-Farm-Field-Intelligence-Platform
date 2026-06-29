import request from "supertest";
import express from "express";

jest.mock("../../src/repositories/fieldRepository", () => ({
  findFieldById: jest.fn(),
}));

jest.mock("../../src/repositories/soilRepository", () => ({
  getHistoryByFieldId: jest.fn(),
  findLatestSoilByFieldId: jest.fn(),
  insertSoilData: jest.fn(),
}));

jest.mock("../../src/services/soilService", () => ({
  ...jest.requireActual("../../src/services/soilService"),
  getSoilProperties: jest.fn(),
}));

jest.mock("../../src/services/fieldService", () => ({
  findFieldByIdService: jest.fn(),
}));

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

import {
  getFieldSoilHistory,
  getFieldSoil,
} from "../../src/controllers/soilController";

import { findFieldByIdService } from "../../src/services/fieldService";
import { getHistoryByFieldId } from "../../src/repositories/soilRepository";
import { getSoilProperties } from "../../src/services/soilService";
import { pool } from "../../src/config/db";

describe("Soil Controller - FINAL 100%", () => {
  const createApp = (user?: any) => {
    const app = express();
    app.use(express.json());

    app.get("/history/:fieldId?", (req: any, res) => {
      req.user = user;
      return getFieldSoilHistory(req, res);
    });

    app.get("/soil/:fieldId?", (req: any, res) => {
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

  it("should return 400 if fieldId is missing in getFieldSoilHistory", async () => {
    const res = await request(createApp({ id: "user1" })).get("/history");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Field ID required");
  });

  it("should return 400 if fieldId is missing in getFieldSoil", async () => {
    const res = await request(createApp({ id: "user1" })).get("/soil");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Field ID required");
  });

  it("should return 404 if field not found", async () => {
    (findFieldByIdService as jest.Mock).mockResolvedValue(null);

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.status).toBe(404);
  });

  it("should return 404 if field not found in getFieldSoil", async () => {
    (findFieldByIdService as jest.Mock).mockResolvedValue(null);
    const res = await request(createApp({ id: "user1" })).get(
      "/soil/field1",
    );
    expect(res.status).toBe(404);
  });

  it("should return 403 if not owner", async () => {
    (findFieldByIdService as jest.Mock).mockResolvedValue({
      ...mockField,
      user_id: "other",
    });

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.status).toBe(403);
  });

  it("should return 403 if not owner in getFieldSoil", async () => {
    (findFieldByIdService as jest.Mock).mockResolvedValue({
      ...mockField,
      user_id: "other",
    });

    const res = await request(createApp({ id: "user1" })).get(
      "/soil/field1",
    );

    expect(res.status).toBe(403);
  });

  //core alert logic

  it("should execute ALL inner branches (no alerts case)", async () => {
    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);

    //  Forces:
    // - newestTop && oldestTop = true
    // - all thresholds = FALSE
    (getHistoryByFieldId as jest.Mock).mockResolvedValue({
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
    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);

    (getHistoryByFieldId as jest.Mock).mockResolvedValue({
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

  it("should not compute alerts when history has fewer than 2 records", async () => {
    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);

    (getHistoryByFieldId as jest.Mock).mockResolvedValue({
      rows: [
        {
          year: 2025,
          data: { layers: [{ ph: 7, organicCarbon: 10, nitrogen: 30 }] },
        },
      ],
    });

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.status).toBe(200);
    expect(res.body.data.records.length).toBe(1);
    expect(res.body.data.alerts).toEqual([]);
  });

  // FORCE missing layers
  it("should skip when layers missing", async () => {
    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);

    (getHistoryByFieldId as jest.Mock).mockResolvedValue({
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
    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);

    (getHistoryByFieldId as jest.Mock).mockResolvedValue({
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
    (findFieldByIdService as jest.Mock).mockRejectedValue(new Error("fail"));

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(createApp({ id: "user1" })).get(
      "/history/field1",
    );

    expect(res.status).toBe(500);

    spy.mockRestore();
  });

  it("should return Kharif", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-06-01"));

    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockResolvedValue({ layers: [] });
    (pool.query as jest.Mock).mockResolvedValue({});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.body.data.season).toBe("Kharif");

    jest.useRealTimers();
  });

  it("should return Kharif preparation", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-03-01"));

    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockResolvedValue({ layers: [] });
    (pool.query as jest.Mock).mockResolvedValue({});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.body.data.season).toBe("Kharif preparation");

    jest.useRealTimers();
  });

  it("should return Rabi preparation ✅ FIX", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-01")); // ✅ October

    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockResolvedValue({ layers: [] });
    (pool.query as jest.Mock).mockResolvedValue({});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.body.data.season).toBe("Rabi preparation");

    jest.useRealTimers();
  });

  it("should return Rabi", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01"));

    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockResolvedValue({ layers: [] });
    (pool.query as jest.Mock).mockResolvedValue({});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.body.data.season).toBe("Rabi");

    jest.useRealTimers();
  });

  // error path
  it("should handle soil API error", async () => {
    (findFieldByIdService as jest.Mock).mockResolvedValue(mockField);
    (getSoilProperties as jest.Mock).mockRejectedValue(new Error("fail"));

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(createApp({ id: "user1" })).get("/soil/field1");

    expect(res.status).toBe(500);

    spy.mockRestore();
  });

});
