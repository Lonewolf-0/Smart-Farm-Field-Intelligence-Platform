import request from "supertest";
import express from "express";
import analysisRoutes from "../../src/routes/analysisRoutes";
import * as repo from "../../src/repositories/fieldRepository";
import * as weatherService from "../../src/services/weatherService";

jest.mock("../../src/middlewares/authMiddleware", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { id: "user1" };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use("/api/analysis", analysisRoutes);

describe("Field Weather Integration", () => {
  // SUCCESS
  it("should return weather for valid field", async () => {
    jest.spyOn(repo, "findFieldById").mockResolvedValue({
      id: "1",
      user_id: "user1",
      centroid_lat: 18,
      centroid_lng: 73,
    } as any);

    jest
      .spyOn(weatherService, "getWeatherData")
      .mockResolvedValue({ temperature: 30 } as any);

    const res = await request(app).post("/api/analysis/1/weather");

    expect(res.status).toBe(200);
  });

  // 403
  it("should return 403 if not owner", async () => {
    jest.spyOn(repo, "findFieldById").mockResolvedValue({
      id: "1",
      user_id: "otherUser",
    } as any);

    const res = await request(app).post("/api/analysis/1/weather");

    expect(res.status).toBe(403);
  });
});
