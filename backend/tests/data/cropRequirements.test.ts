import { cropRequirements } from "../../src/data/cropRequirements";

describe("Crop Requirements", () => {
  it("should have at least 15 crops", () => {
    expect(cropRequirements.length).toBeGreaterThanOrEqual(15);
  });

  it("should have valid pH ranges", () => {
    cropRequirements.forEach((crop) => {
      expect(crop.minPH).toBeLessThan(crop.maxPH);
    });
  });

  it("should have valid temperature ranges", () => {
    cropRequirements.forEach((crop) => {
      expect(crop.minTemperature).toBeLessThan(crop.maxTemperature);
    });
  });

  it("should have valid rainfall ranges", () => {
    cropRequirements.forEach((crop) => {
      expect(crop.minRainfall).toBeLessThan(crop.maxRainfall);
    });
  });

  it("should have valid season", () => {
    cropRequirements.forEach((crop) => {
      expect(["kharif", "rabi", "zaid"]).toContain(crop.season);
    });
  });

  it("should have required fields", () => {
    cropRequirements.forEach((crop) => {
      expect(crop.name).toBeDefined();
      expect(crop.preferredSoilTexture.length).toBeGreaterThan(0);
    });
  });
});
