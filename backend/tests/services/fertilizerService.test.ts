import { calculateFertilizer } from "../../src/services/fertilizerService";

describe("Fertilizer Service ", () => {
  // LOW SOIL → HIGH FERTILIZER
  it("should recommend higher fertilizer for low soil nutrients", () => {
    const soil = { nitrogen: 10, phosphorus: 5, potassium: 5 };

    const result = calculateFertilizer(soil, "Wheat", 1);

    expect(result.nitrogenDeficit).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  //  HIGH SOIL → LOW FERTILIZER
  it("should recommend less fertilizer for high soil nutrients", () => {
    const soil = { nitrogen: 200, phosphorus: 100, potassium: 100 };

    const result = calculateFertilizer(soil, "Wheat", 1);

    expect(result.totalQuantity).toBeLessThan(100);
  });

  //  ZERO DEFICIT
  it("should return no fertilizer needed when no deficit", () => {
    const soil = { nitrogen: 500, phosphorus: 300, potassium: 300 };

    const result = calculateFertilizer(soil, "Wheat", 1);

    expect(result.recommendations.length).toBe(0);
    expect(result.applicationSchedule).toContain("No fertilizer needed");
  });

  //  UNKNOWN CROP
  it("should throw error for unsupported crop", () => {
    const soil = { nitrogen: 50, phosphorus: 50, potassium: 50 };

    expect(() => calculateFertilizer(soil, "UnknownCrop", 1)).toThrow(
      "Crop not supported",
    );
  });

  //  AREA SCALING
  it("should scale fertilizer based on field area", () => {
    const soil = { nitrogen: 10, phosphorus: 10, potassium: 10 };

    const result1 = calculateFertilizer(soil, "Wheat", 1);
    const result2 = calculateFertilizer(soil, "Wheat", 2);

    expect(result2.totalQuantity).toBeGreaterThan(result1.totalQuantity);
  });

  //  DAP NITROGEN ADJUSTMENT
  it("should reduce urea due to DAP nitrogen contribution", () => {
    const soil = { nitrogen: 0, phosphorus: 0, potassium: 0 };

    const result = calculateFertilizer(soil, "Wheat", 1);

    const urea = result.recommendations.find((r) => r.name === "Urea");

    expect(urea?.quantity).toBeGreaterThan(0);
  });
});
