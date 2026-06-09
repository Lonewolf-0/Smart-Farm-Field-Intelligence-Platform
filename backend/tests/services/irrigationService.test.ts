import {
  getAWCFromTexture,
  calculateIrrigation,
} from "../../src/services/irrigationService";

describe("Irrigation Service", () => {
  //  getAWCFromTexture
  describe("getAWCFromTexture", () => {
    it("should return 175 for clay", () => {
      expect(getAWCFromTexture("clay")).toBe(175);
      expect(getAWCFromTexture("clay loam")).toBe(175);
    });

    it("should return 125 for loam", () => {
      expect(getAWCFromTexture("loam")).toBe(125);
    });

    it("should return 87.5 for sandy loam", () => {
      expect(getAWCFromTexture("sandy loam")).toBe(87.5);
    });

    it("should return 62.5 for sand", () => {
      expect(getAWCFromTexture("sand")).toBe(62.5);
      expect(getAWCFromTexture("fine sand")).toBe(62.5);
    });

    it("should return default 125", () => {
      expect(getAWCFromTexture("unknown")).toBe(125);
    });
  });

  //  calculateIrrigation
  describe("calculateIrrigation", () => {
    const soil = { texture: "loam" };

    it("should calculate irrigation with nasa data and weather", () => {
      const weather = {
        forecast: [{ precipitation: 5 }, { precipitation: 0 }],
      };

      const nasaData = [
        { et0: 4, precipitation: 2 },
        { et0: 3, precipitation: 1 },
      ];

      const result = calculateIrrigation(soil, weather as any, nasaData);

      expect(result).toHaveProperty("nextIrrigationDays");
      expect(result).toHaveProperty("waterRequired");
      expect(result).toHaveProperty("currentSoilMoisture");
      expect(result).toHaveProperty("dailyET");
      expect(result).toHaveProperty("rainfallNext7Days");

      expect(typeof result.nextIrrigationDays).toBe("number");
    });

    //  no nasa data → fallback ET
    it("should use fallback ET0 when nasa data is empty", () => {
      const result = calculateIrrigation(soil, { forecast: [] } as any, []);

      expect(result.dailyET).toBe(3.0);
    });

    //  no weather forecast
    it("should handle missing weather forecast", () => {
      const nasaData = [{ et0: 2, precipitation: 0 }];

      const result = calculateIrrigation(soil, {} as any, nasaData);

      expect(result.rainfallNext7Days).toBe(0);
    });

    //  moisture goes below MAD during projection
    it("should trigger irrigation within loop", () => {
      const weather = { forecast: [] };
      const nasaData = [
        { et0: 10, precipitation: 0 }, // fast depletion
      ];

      const result = calculateIrrigation(soil, weather as any, nasaData);

      expect(result.nextIrrigationDays).toBeGreaterThanOrEqual(0);
      expect(result.waterRequired).toBeGreaterThanOrEqual(0);
    });

    //  case: never drops below MAD (14-day path)
    it("should set irrigation to 14 days when moisture stays above MAD", () => {
      const weather = {
        forecast: Array(14).fill({ precipitation: 10 }), // keeps adding water
      };

      const nasaData = [{ et0: 1, precipitation: 5 }];

      const result = calculateIrrigation(soil, weather as any, nasaData);

      expect(result.nextIrrigationDays).toBe(14);
      expect(result.waterRequired).toBe(0);
    });

    //  case: already below MAD at start
    it("should trigger immediate irrigation when already below MAD", () => {
      const nasaData = [
        { et0: 200, precipitation: 0 }, // extreme depletion
      ];

      const result = calculateIrrigation(
        soil,
        { forecast: [] } as any,
        nasaData,
      );

      expect(result.nextIrrigationDays).toBe(0);
      expect(result.waterRequired).toBeGreaterThan(0);
    });

    // bounds: moisture never exceeds AWC or goes below 0
    it("should bound moisture between 0 and AWC", () => {
      const weather = {
        forecast: [{ precipitation: 1000 }],
      };

      const nasaData = [{ et0: 0, precipitation: 1000 }];

      const result = calculateIrrigation(soil, weather as any, nasaData);

      expect(result.currentSoilMoisture).toBeLessThanOrEqual(100);
      expect(result.currentSoilMoisture).toBeGreaterThanOrEqual(0);
    });

    //  rainfall accumulation
    it("should correctly sum rainfallNext7Days", () => {
      const weather = {
        forecast: [
          { precipitation: 2 },
          { precipitation: 3 },
          { precipitation: 5 },
        ],
      };

      const result = calculateIrrigation(soil, weather as any, []);

      expect(result.rainfallNext7Days).toBe(10);
    });
  });
});
