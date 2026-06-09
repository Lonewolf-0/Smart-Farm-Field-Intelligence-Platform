import request from "supertest";
import express from "express";

jest.mock("../../src/repositories/fieldRepository", () => ({
  findFieldById: jest.fn(),
}));

jest.mock("../../src/repositories/soilRepository", () => ({
  getHistoryByFieldId: jest.fn(),
  findLatestSoilByFieldId: jest.fn(),
}));

jest.mock("../../src/services/soilService", () => ({
  ...jest.requireActual("../../src/services/soilService"),
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
import { getHistoryByFieldId } from "../../src/repositories/soilRepository";
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
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

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
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

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
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

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
    (findFieldById as jest.Mock).mockResolvedValue(mockField);

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

  describe("Direct function calls for full coverage", () => {
    const mockRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it("should return 400 if fieldId is missing in getFieldSoilHistory", async () => {
      const req = { user: { id: "user1" }, params: {} };
      const res = mockRes();
      await getFieldSoilHistory(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Field ID required" }));
    });


    it("should return 400 if fieldId is missing in getFieldSoil", async () => {
      const req = { user: { id: "user1" }, params: {} };
      const res = mockRes();
      await getFieldSoil(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Field ID required" }));
    });

    it("should return 404 if field is not found in getFieldSoil", async () => {
      (findFieldById as jest.Mock).mockResolvedValueOnce(null);
      const req = { user: { id: "user1" }, params: { fieldId: "nonexistent" } };
      const res = mockRes();
      await getFieldSoil(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Field not found" }));
    });

    it("should return 403 if user is not the field owner in getFieldSoil", async () => {
      (findFieldById as jest.Mock).mockResolvedValueOnce({
        id: "field1",
        user_id: "other",
      });
      const req = { user: { id: "user1" }, params: { fieldId: "field1" } };
      const res = mockRes();
      await getFieldSoil(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Forbidden" }));
    });
  });
});
