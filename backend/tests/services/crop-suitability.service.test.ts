import { calculateCropSuitability } from "../../src/services/crop-suitability.service";

describe("Crop Suitability Service", () => {
  const idealSoil = {
    ph: 6.5,
    soilTexture: "loamy",
    organicCarbon: 0.6,
  };

  const idealWeather = {
    temperature: 22,
    humidity: 50,
    windSpeed: 5,
    rainfall: 2, // daily
    forecast: [],
  };

  // Happy path
  it("should return top 10 crops", () => {
    const result = calculateCropSuitability(idealSoil, idealWeather);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  //  WHEAT SHOULD SCORE HIGH
  it("should score wheat high for suitable conditions", () => {
    const result = calculateCropSuitability(idealSoil, idealWeather);

    const wheat = result.find((c) => c.name === "Wheat");

    expect(wheat?.score).toBeGreaterThan(70);
  });

  //  LOW SCORE FOR WRONG CONDITIONS
  it("should score tropical crops low in cold conditions", () => {
    const coldWeather = {
      ...idealWeather,
      temperature: 5,
    };

    const result = calculateCropSuitability(idealSoil, coldWeather, true);

    const rice = result.find((c) => c.name === "Rice");

    expect(rice?.score).toBeLessThan(60);
  });

  //  PH EDGE CASE
  it("should reduce score for bad pH", () => {
    const badSoil = {
      ...idealSoil,
      ph: 3,
    };

    const result = calculateCropSuitability(badSoil, idealWeather);

    expect(result[0].score).toBeLessThan(80);
  });
});
