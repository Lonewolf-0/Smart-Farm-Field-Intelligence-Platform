import { assessPestRisk } from "../../src/services/pesticideService";
import { pestDatabase } from "../../src/data/pestDatabase";

// mock pestDatabase to fully control branches
jest.mock("../../src/data/pestDatabase", () => ({
  pestDatabase: [
    {
      name: "Fungus Pest",
      type: "fungus",
      affectedCrops: ["rice"],
      favorableConditions: {
        minTemp: 20,
        maxTemp: 30,
        minHumidity: 60,
        season: "kharif",
      },
      treatments: [{ name: "Fungicide Spray" }],
    },
    {
      name: "Insect Pest",
      type: "insect",
      affectedCrops: ["rice"],
      favorableConditions: {
        minTemp: 25,
        maxTemp: 35,
        minHumidity: 50,
        season: "rabi",
      },
      treatments: [{ name: "Insecticide Spray" }],
    },
  ],
}));

describe("Pesticide Service - assessPestRisk", () => {
  const baseWeather = {
    temperature: 28,
    humidity: 70,
    rainfall: 60,
  };

  //  FULL HIGH RISK (fungus)

  it("should return High risk with treatment", () => {
    const result = assessPestRisk("rice", baseWeather as any, "kharif");

    const pest = result.find((p) => p.pestName === "Fungus Pest")!;

    expect(pest.riskLevel).toBe("High");
    expect(pest.recommendation).toBe("Spray recommended");
    expect(pest.treatment).not.toBeNull();
  });

  //  MEDIUM RISK

  it("should return Medium risk", () => {
    const weather = {
      temperature: 18, // near temp range → partial
      humidity: 50, // near humidity
      rainfall: 25, // medium rain
    };

    const result = assessPestRisk("rice", weather as any, "summer");

    const pest = result[0];

    expect(pest.riskLevel).toBe("Medium");
    expect(pest.recommendation).toBe("Monitor closely");
    expect(pest.treatment).toBeNull();
  });

  //  LOW RISK

  it("should return Low risk", () => {
    const weather = {
      temperature: 5,
      humidity: 10,
      rainfall: 100,
    };

    const result = assessPestRisk("rice", weather as any, "winter");

    const pest = result[0];

    expect(pest.riskLevel).toBe("Low");
    expect(pest.recommendation).toBe("No action needed");
  });

  //  PARTIAL TEMP RANGE (+15)

  it("should handle partial temperature match", () => {
    const weather = {
      temperature: 18, // minTemp-2 (partial)
      humidity: 70,
      rainfall: 60,
    };

    const result = assessPestRisk("rice", weather as any, "kharif");

    expect(result.length).toBeGreaterThan(0);
  });

  // HUMIDITY PARTIAL (+15)

  it("should handle partial humidity match", () => {
    const weather = {
      temperature: 25,
      humidity: 50, // near minHumidity
      rainfall: 60,
    };

    const result = assessPestRisk("rice", weather as any, "kharif");

    expect(result.length).toBeGreaterThan(0);
  });

  //  SEASON PARTIAL MATCH (+10)
  it("should give partial season score", () => {
    const result = assessPestRisk("rice", baseWeather as any, "summer");

    expect(result[0].riskScore).toBeGreaterThan(0);
  });

  //  INSECT RAINFALL LOGIC
  it("should apply insect rainfall logic", () => {
    const weather = {
      temperature: 30,
      humidity: 60,
      rainfall: 5, // low rainfall → insect benefit
    };

    const result = assessPestRisk("rice", weather as any, "rabi");

    const insect = result.find((p) => p.pestName === "Insect Pest")!;

    expect(insect.riskScore).toBeGreaterThan(0);
  });

  //  RISK SCORE CAP AT 100
  it("should cap riskScore at 100", () => {
    const weather = {
      temperature: 28,
      humidity: 100,
      rainfall: 100,
    };

    const result = assessPestRisk("rice", weather as any, "kharif");

    const pest = result[0];

    expect(pest.riskScore).toBeLessThanOrEqual(100);
  });

  //  CASE INSENSITIVE CROP MATCH
  it("should match crop case-insensitively", () => {
    const result = assessPestRisk("RICE", baseWeather as any, "kharif");

    expect(result.length).toBeGreaterThan(0);
  });

  //  NO MATCHING CROPS

  it("should return empty array if no crop matches", () => {
    const result = assessPestRisk("wheat", baseWeather as any, "rabi");

    expect(result).toEqual([]);
  });
});
