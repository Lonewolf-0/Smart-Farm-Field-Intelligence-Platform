import request from "supertest";
import express from "express";

jest.mock("../../src/repositories/fieldRepository", () => ({
  findFieldById: jest.fn(),
}));

jest.mock("../../src/services/weatherService", () => ({
  getWeatherData: jest.fn(),
}));

jest.mock("../../src/services/pesticideService", () => ({
  assessPestRisk: jest.fn(),
}));

jest.mock("../../src/services/cropService", () => ({
  getCropSuitabilityService: jest.fn(),
}));

import { getPesticideRecommendation } from "../../src/controllers/pesticideController";
import { findFieldById } from "../../src/repositories/fieldRepository";
import { getWeatherData } from "../../src/services/weatherService";
import { assessPestRisk } from "../../src/services/pesticideService";
import { getCropSuitabilityService } from "../../src/services/cropService";

describe("Pesticide Controller", () => {
  const createApp = (user?: any, body?: any) => {
    const app = express();
    app.use(express.json());

    app.get("/pesticide/:fieldId", (req: any, res) => {
      req.user = user;
      req.body = body || {};
      return getPesticideRecommendation(req, res);
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

  //field not found
  it("should return 404 when field not found", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(null);

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.status).toBe(404);
  });

  //forbidden
  it("should return 403 when not owner", async () => {
    (findFieldById as jest.Mock).mockResolvedValue({
      ...mockField,
      user_id: "otherUser",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("FIELD_ACCESS_DENIED");
  });

  //no crops provided + no suitable crops
  it("should return 400 when crop cannot be determined", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getWeatherData as jest.Mock).mockResolvedValue({});
    (getCropSuitabilityService as jest.Mock).mockResolvedValue([]);

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Could not determine a target crop. Please provide one.",
    );
  });

  //use provided crops
  it("should use crop from request body", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getWeatherData as jest.Mock).mockResolvedValue({});
    (assessPestRisk as jest.Mock).mockReturnValue([{ risk: "High" }]);

    const app = createApp(
      { id: "user1" },
      { crop: "rice", growthStage: "early" },
    );

    const res = await request(app).get("/pesticide/field1");

    expect(res.status).toBe(200);
    expect(res.body.data.crop).toBe("rice");
    expect(res.body.data.growthStage).toBe("early");
  });

  //auto select crops from service
  it("should fallback to crop from suitability service", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getWeatherData as jest.Mock).mockResolvedValue({});
    (getCropSuitabilityService as jest.Mock).mockResolvedValue([
      { name: "wheat" },
    ]);

    (assessPestRisk as jest.Mock).mockReturnValue([{ risk: "Medium" }]);

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.status).toBe(200);
    expect(res.body.data.crop).toBe("wheat");
  });

  //default growth stage
  it("should set default growth stage when not provided", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getWeatherData as jest.Mock).mockResolvedValue({});
    (assessPestRisk as jest.Mock).mockReturnValue([]);

    const app = createApp({ id: "user1" }, { crop: "rice" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.body.data.growthStage).toBe("Unknown");
  });

  //success full flow
  it("should return full pesticide recommendation", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getWeatherData as jest.Mock).mockResolvedValue({ temp: 30 });

    (assessPestRisk as jest.Mock).mockReturnValue([
      { pest: "p1", riskLevel: "High" },
    ]);

    const app = createApp(
      { id: "user1" },
      { crop: "rice", growthStage: "mid" },
    );

    const res = await request(app).get("/pesticide/field1");

    expect(res.status).toBe(200);
    expect(res.body.data.assessments).toBeDefined();
    expect(res.body.data.season).toBeDefined(); // ✅ season branch
  });

  //error handling
  it("should return error from catch block", async () => {
    (findFieldById as jest.Mock).mockRejectedValue({
      status: 500,
      message: "Custom error",
      code: "ERR",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Custom error");
    expect(res.body.error).toBe("ERR");
  });

  //error default fallback
  it("should fallback to default error message", async () => {
    (findFieldById as jest.Mock).mockRejectedValue({});

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch pesticide recommendations");
  });
  it("should return Winter season", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-15")); // ✅ January → Winter

    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getWeatherData as jest.Mock).mockResolvedValue({});
    (assessPestRisk as jest.Mock).mockReturnValue([]);

    const app = createApp({ id: "user1" }, { crop: "rice" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.body.data.season).toBe("Winter");

    jest.useRealTimers();
  });
  it("should return Spring season", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-10")); // ✅ April → Spring

    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (getWeatherData as jest.Mock).mockResolvedValue({});
    (assessPestRisk as jest.Mock).mockReturnValue([]);

    const app = createApp({ id: "user1" }, { crop: "rice" });

    const res = await request(app).get("/pesticide/field1");

    expect(res.body.data.season).toBe("Spring / Warm Dry Weather");

    jest.useRealTimers();
  });
});
