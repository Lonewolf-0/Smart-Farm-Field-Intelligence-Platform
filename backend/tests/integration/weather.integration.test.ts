import request from "supertest";
import express from "express";
import weatherRoutes from "../../src/routes/weather.routes";
import * as weatherService from "../../src/services/weather.service";

const app = express();
app.use("/api/weather", weatherRoutes);

describe("Weather Integration", () => {
  const mockData = {
    temperature: 30,
    humidity: 70,
    windSpeed: 5,
    rainfall: 1,
    forecast: [],
  };

  // SUCCESS
  it("should return weather successfully", async () => {
    jest.spyOn(weatherService, "getWeatherData").mockResolvedValue(mockData);

    const res = await request(app).get("/api/weather?lat=18&lng=73");

    expect(res.status).toBe(200);
    expect(res.body.data.temperature).toBe(30);
  });

  // ERROR
  it("should return error when service fails", async () => {
    jest
      .spyOn(weatherService, "getWeatherData")
      .mockRejectedValue(new Error("FAIL"));

    const res = await request(app).get("/api/weather?lat=18&lng=73");

    expect(res.status).toBe(500);
  });
});
