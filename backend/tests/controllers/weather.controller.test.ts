import request from "supertest";
import express from "express";
import { getWeatherController } from "../../src/controllers/weather.controller";
import * as weatherService from "../../src/services/weather.service";

const app = express();
app.get("/weather", getWeatherController);

describe("Weather Controller", () => {
  const mockData = {
    temperature: 30,
    humidity: 70,
    windSpeed: 5,
    rainfall: 0,
    forecast: [],
  };

  // SUCCESS
  it("should return weather data", async () => {
    jest.spyOn(weatherService, "getWeatherData").mockResolvedValue(mockData);

    const res = await request(app).get("/weather?lat=18&lng=73");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // ERROR
  it("should handle errors", async () => {
    jest
      .spyOn(weatherService, "getWeatherData")
      .mockRejectedValue(new Error("FAIL"));

    const res = await request(app).get("/weather?lat=18&lng=73");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
