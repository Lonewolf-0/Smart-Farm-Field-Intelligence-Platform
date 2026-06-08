import { assessRisks } from "../../src/services/riskService";

describe("Risk Service", () => {
  const baseSoil = {
    ph: 6.5,
    organicCarbon: 0.6,
    soilTexture: "clay",
  };

  //  1. DROUGHT
  it("should detect drought", () => {
    const weather: any = {
      forecast: Array.from({ length: 10 }).map((_, i) => ({
        date: `2024-01-${i + 1}`,
        tempMax: 36,
        tempMin: 25,
        precipitation: 0,
      })),
    };

    const result = assessRisks(weather, baseSoil);

    expect(result.some((r) => r.type === "drought")).toBe(true);
  });

  // 2. FROST (< 2°C)
  it("should detect frost risk", () => {
    const weather: any = {
      forecast: [{ date: "1", tempMax: 10, tempMin: 1, precipitation: 0 }],
    };

    const result = assessRisks(weather, baseSoil);

    expect(result.some((r) => r.type === "frost")).toBe(true);
  });

  // 3. FROST HIGH (< 0°C)
  it("should detect high severity frost", () => {
    const weather: any = {
      forecast: [{ date: "1", tempMax: 5, tempMin: -1, precipitation: 0 }],
    };

    const result = assessRisks(weather, baseSoil);

    const frost = result.find((r) => r.type === "frost");

    expect(frost?.severity).toBe("high");
  });

  // 4. HEAT STRESS
  it("should detect heat stress", () => {
    const weather: any = {
      forecast: [
        { date: "1", tempMax: 41, tempMin: 25, precipitation: 0 },
        { date: "2", tempMax: 42, tempMin: 26, precipitation: 0 },
      ],
    };

    const result = assessRisks(weather, baseSoil);

    expect(result.some((r) => r.type === "heat_stress")).toBe(true);
  });

  // 5. HEAT STRESS HIGH (>42°C)
  it("should detect high severity heat stress", () => {
    const weather: any = {
      forecast: [
        { date: "1", tempMax: 43, tempMin: 25, precipitation: 0 },
        { date: "2", tempMax: 44, tempMin: 26, precipitation: 0 },
      ],
    };

    const result = assessRisks(weather, baseSoil);

    const heat = result.find((r) => r.type === "heat_stress");

    expect(heat?.severity).toBe("high");
  });

  // 6. HEAVY RAIN (single day >50mm)
  it("should detect heavy rain", () => {
    const weather: any = {
      forecast: [{ date: "1", tempMax: 30, tempMin: 20, precipitation: 60 }],
    };

    const result = assessRisks(weather, baseSoil);

    expect(result.some((r) => r.type === "heavy_rain")).toBe(true);
  });

  // 7. HEAVY RAIN HIGH (>80mm)
  it("should detect high severity heavy rain", () => {
    const weather: any = {
      forecast: [{ date: "1", tempMax: 30, tempMin: 20, precipitation: 90 }],
    };

    const result = assessRisks(weather, baseSoil);

    const rain = result.find((r) => r.type === "heavy_rain");

    expect(rain?.severity).toBe("high");
  });

  // 8. CUMULATIVE RAIN (>100mm in 3 days)
  it("should detect cumulative heavy rain", () => {
    const weather: any = {
      forecast: [
        { date: "1", tempMax: 30, tempMin: 20, precipitation: 40 },
        { date: "2", tempMax: 30, tempMin: 20, precipitation: 40 },
        { date: "3", tempMax: 30, tempMin: 20, precipitation: 40 },
      ],
    };

    const result = assessRisks(weather, baseSoil);

    expect(result.some((r) => r.type === "heavy_rain")).toBe(true);
  });

  // 9. FLOODING (clay + rain)
  it("should detect flooding", () => {
    const weather: any = {
      forecast: [{ date: "1", tempMax: 30, tempMin: 20, precipitation: 60 }],
    };

    const result = assessRisks(weather, baseSoil);

    expect(result.some((r) => r.type === "flooding")).toBe(true);
  });

  // 10. HAIL
  it("should detect hailstorm", () => {
    const weather: any = {
      forecast: [
        {
          date: "1",
          tempMax: 30,
          tempMin: 15,
          precipitation: 10,
          condition: "thunderstorm",
        },
      ],
    };

    const result = assessRisks(weather, baseSoil);

    expect(result.some((r) => r.type === "hail")).toBe(true);
  });

  // 11. NORMAL CONDITIONS
  it("should return empty when no risks detected", () => {
    const weather: any = {
      forecast: [
        { date: "1", tempMax: 30, tempMin: 20, precipitation: 5 },
        { date: "2", tempMax: 31, tempMin: 21, precipitation: 10 },
      ],
    };

    const result = assessRisks(weather, baseSoil);

    expect(result.length).toBe(0);
  });
});
