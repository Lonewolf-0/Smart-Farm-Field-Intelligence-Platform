import { cropNutrientRequirements } from "../../src/data/crop-nutrient-requirements";

describe("Crop Nutrient Requirements", () => {
  // 1. MINIMUM COUNT
  it("should have at least 15 crops", () => {
    expect(cropNutrientRequirements.length).toBeGreaterThanOrEqual(15);
  });

  // 2. VALID NPK VALUES
  it("should have valid NPK values", () => {
    cropNutrientRequirements.forEach((crop) => {
      expect(crop.nitrogenRequired).toBeGreaterThan(0);
      expect(crop.phosphorusRequired).toBeGreaterThan(0);
      expect(crop.potassiumRequired).toBeGreaterThan(0);
    });
  });

  // 3. VALID YIELD
  it("should have valid yield targets", () => {
    cropNutrientRequirements.forEach((crop) => {
      expect(crop.yieldTarget).toBeGreaterThan(0);
    });
  });

  // 4. VALID SEASON
  it("should have valid season", () => {
    cropNutrientRequirements.forEach((crop) => {
      expect(["kharif", "rabi", "zaid"]).toContain(crop.season);
    });
  });

  // 5. REQUIRED FIELDS
  it("should have all required properties", () => {
    cropNutrientRequirements.forEach((crop) => {
      expect(crop.cropName).toBeDefined();
      expect(typeof crop.cropName).toBe("string");

      expect(crop.nitrogenRequired).toBeDefined();
      expect(crop.phosphorusRequired).toBeDefined();
      expect(crop.potassiumRequired).toBeDefined();
    });
  });
});
``;
