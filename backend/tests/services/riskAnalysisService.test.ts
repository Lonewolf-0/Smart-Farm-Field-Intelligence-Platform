//  mock all dependencies
jest.mock("../../src/repositories/fieldRepository", () => ({
  findFieldById: jest.fn(),
}));

jest.mock("../../src/repositories/soilRepository", () => ({
  findLatestSoilByFieldId: jest.fn(),
}));

jest.mock("../../src/services/weatherService", () => ({
  getWeatherData: jest.fn(),
}));

jest.mock("../../src/services/riskService", () => ({
  assessRisks: jest.fn(),
}));

import { getRiskAnalysisService } from "../../src/services/riskAnalysisService";

import { findFieldById } from "../../src/repositories/fieldRepository";
import { findLatestSoilByFieldId } from "../../src/repositories/soilRepository";
import { getWeatherData } from "../../src/services/weatherService";
import { assessRisks } from "../../src/services/riskService";

describe("RiskAnalysisService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const userId = "user-1";
  const fieldId = "field-1";

  const mockField = {
    id: fieldId,
    user_id: userId,
    centroid_lat: 10,
    centroid_lng: 20,
  };

  const mockSoil = {
    data: {
      layers: [
        {
          ph: 6.5,
          organicCarbon: 1.2,
          texture: "LOAM",
        },
      ],
    },
  };

  const mockWeather = { temp: 30 };
  const mockRiskResult = [{ risk: "low" }];

  //  SUCCESS CASE

  it("should return risk analysis successfully", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (findLatestSoilByFieldId as jest.Mock).mockResolvedValue(mockSoil);
    (getWeatherData as jest.Mock).mockResolvedValue(mockWeather);
    (assessRisks as jest.Mock).mockReturnValue(mockRiskResult);

    const result = await getRiskAnalysisService(userId, fieldId);

    expect(getWeatherData).toHaveBeenCalledWith(10, 20);

    expect(assessRisks).toHaveBeenCalledWith(mockWeather, {
      ph: 6.5,
      organicCarbon: 1.2,
      soilTexture: "loam",
    });

    expect(result).toEqual(mockRiskResult);
  });

  //  FIELD NOT FOUND (404)

  it("should throw 404 when field not found", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(null);

    await expect(getRiskAnalysisService(userId, fieldId)).rejects.toEqual({
      status: 404,
      message: "Field not found",
    });
  });

  //  FORBIDDEN (403)

  it("should throw 403 when user is not owner", async () => {
    (findFieldById as jest.Mock).mockResolvedValue({
      ...mockField,
      user_id: "other-user",
    });

    await expect(getRiskAnalysisService(userId, fieldId)).rejects.toEqual({
      status: 403,
      message: "Forbidden",
      code: "FIELD_ACCESS_DENIED",
    });
  });

  //  NO SOIL DATA (400)
  it("should throw 400 when soil not found", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (findLatestSoilByFieldId as jest.Mock).mockResolvedValue(null);

    await expect(getRiskAnalysisService(userId, fieldId)).rejects.toEqual({
      status: 400,
      message: "Run soil analysis first",
    });
  });

  //  LOWERCASE TEXTURE CHECK
  it("should convert soil texture to lowercase", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (findLatestSoilByFieldId as jest.Mock).mockResolvedValue(mockSoil);
    (getWeatherData as jest.Mock).mockResolvedValue(mockWeather);
    (assessRisks as jest.Mock).mockReturnValue(mockRiskResult);

    await getRiskAnalysisService(userId, fieldId);

    expect(assessRisks).toHaveBeenCalledWith(
      mockWeather,
      expect.objectContaining({
        soilTexture: "loam",
      }),
    );
  });

  //  WEATHER FAILURE PROPAGATION
  it("should propagate error if weather service fails", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (findLatestSoilByFieldId as any)?.mockResolvedValue?.(mockSoil);

    (findLatestSoilByFieldId as jest.Mock).mockResolvedValue(mockSoil);
    (getWeatherData as jest.Mock).mockRejectedValue(new Error("Weather error"));

    await expect(getRiskAnalysisService(userId, fieldId)).rejects.toThrow(
      "Weather error",
    );
  });

  //  RISK ENGINE FAILURE
  it("should propagate error if risk engine fails", async () => {
    (findFieldById as jest.Mock).mockResolvedValue(mockField);
    (findLatestSoilByFieldId as jest.Mock).mockResolvedValue(mockSoil);
    (getWeatherData as jest.Mock).mockResolvedValue(mockWeather);
    (assessRisks as jest.Mock).mockImplementation(() => {
      throw new Error("Risk engine failed");
    });

    await expect(getRiskAnalysisService(userId, fieldId)).rejects.toThrow(
      "Risk engine failed",
    );
  });
});
