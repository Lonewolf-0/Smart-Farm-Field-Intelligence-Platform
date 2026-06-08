import { calculateCropSuitability } from "../../src/services/cropSuitabilityService";

describe("Crop Suitability Service", () => {
  const baseWeather = {
    temperature: 25,
    humidity: 50,
    windSpeed: 5,
    rainfall: 2,
    forecast: [],
  };

  // 1. BASIC TEST
  it("should return top 10 crops", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather);

    expect(result.length).toBeLessThanOrEqual(10);
  });

  // 2. PH FULL MATCH
  it("should give 100 pH score when within range", () => {
    const soil = {
      ph: 6.5, // ideal
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather);
    expect(result[0].breakdown.ph).toBe(100);
  });

  // 3. PH NEAR RANGE (70)
  it("should give 70 pH score when near range", () => {
    const soil = {
      ph: 5.6, // slightly outside
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather, true);

    expect(result.some((c) => c.breakdown.ph === 70)).toBe(true);
  });

  // 4. PH FAR (10)
  it("should give low pH score when far from range", () => {
    const soil = {
      ph: 2.0,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather, true);

    expect(result.every((c) => c.breakdown.ph <= 40)).toBe(true);
  });

  // 5. TEMPERATURE FULL MATCH
  it("should score temperature correctly", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const weather = {
      ...baseWeather,
      temperature: 22,
    };

    const result = calculateCropSuitability(soil, weather);

    expect(result[0].breakdown.temperature).toBe(100);
  });

  // 6. TEMPERATURE FAR
  it("should give low temperature score when out of range", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const weather = {
      ...baseWeather,
      temperature: 0,
    };

    const result = calculateCropSuitability(soil, weather, true);

    expect(result.some((c) => c.breakdown.temperature === 10)).toBe(true);
  });

  // 7. RAINFALL FULL MATCH
  it("should give high rainfall score for ideal rain", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const weather = {
      ...baseWeather,
      rainfall: 3, // *365 = ~1000mm (good)
    };

    const result = calculateCropSuitability(soil, weather, true);

    expect(result.some((c) => c.breakdown.rainfall === 100)).toBe(true);
  });

  //  8. RAINFALL LOW
  it("should give low rainfall score when insufficient", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const weather = {
      ...baseWeather,
      rainfall: 0.1,
    };

    const result = calculateCropSuitability(soil, weather, true);

    expect(result.some((c) => c.breakdown.rainfall === 10)).toBe(true);
  });

  //  9. SOIL TEXTURE MATCH
  it("should give 100 for matching soil texture", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather, true);

    expect(result.some((c) => c.breakdown.soilTexture === 100)).toBe(true);
  });

  //  10. SOIL TEXTURE PARTIAL
  it("should give 60 for compatible soil texture", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "silty",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather, true);

    expect(result.some((c) => c.breakdown.soilTexture === 60)).toBe(true);
  });

  //  11. SOIL TEXTURE BAD
  it("should give low score for incompatible soil", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "rocky",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather, true);

    expect(result.every((c) => c.breakdown.soilTexture <= 60)).toBe(true);
  });

  //  12. SORTING TEST
  it("should return sorted crops by score descending", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather);

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });

  //  13. SCORE RANGE TEST
  it("should ensure score is between 0 and 100", () => {
    const soil = {
      ph: 6.5,
      soilTexture: "loamy",
      organicCarbon: 0.6,
    };

    const result = calculateCropSuitability(soil, baseWeather);

    result.forEach((c) => {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
    });
  });
});
