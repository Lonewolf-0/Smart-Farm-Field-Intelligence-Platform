import { getCropSuitabilityService } from "../../src/services/crop.service";

import * as fieldRepo from "../../src/repositories/field.repository";
import * as soilRepo from "../../src/repositories/soil.repository";
import * as weatherService from "../../src/services/weather.service";
import * as suitabilityService from "../../src/services/crop-suitability.service";

describe("Crop Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockField = {
    id: "1",
    user_id: "user1",
    centroid_lat: 18,
    centroid_lng: 73,
  };

  const mockSoil = {
    data: {
      layers: [
        {
          ph: 6.5,
          organicCarbon: 0.6,
          texture: "Loamy",
        },
      ],
    },
  };

  const mockWeather = {
    temperature: 25,
    humidity: 50,
    windSpeed: 5,
    rainfall: 2,
    forecast: [],
  };

  const mockCrops = [{ name: "Wheat", score: 90 }];

  //  1. SUCCESS CASE
  it("should return crop recommendations", async () => {
    jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
    jest
      .spyOn(soilRepo, "findLatestSoilByFieldId")
      .mockResolvedValue(mockSoil as any);
    jest
      .spyOn(weatherService, "getWeatherData")
      .mockResolvedValue(mockWeather as any);
    jest
      .spyOn(suitabilityService, "calculateCropSuitability")
      .mockReturnValue(mockCrops as any);

    const result = await getCropSuitabilityService("user1", "1");

    expect(result).toEqual(mockCrops);

    expect(fieldRepo.findFieldById).toHaveBeenCalledWith("1");
    expect(soilRepo.findLatestSoilByFieldId).toHaveBeenCalledWith("1");
    expect(weatherService.getWeatherData).toHaveBeenCalled();
    expect(suitabilityService.calculateCropSuitability).toHaveBeenCalled();
  });

  //  2. FIELD NOT FOUND
  it("should throw 404 if field not found", async () => {
    jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(null);

    await expect(getCropSuitabilityService("user1", "1")).rejects.toMatchObject(
      {
        status: 404,
        message: "Field not found",
      },
    );
  });

  // 3. UNAUTHORIZED USER
  it("should throw 403 if user does not own field", async () => {
    jest
      .spyOn(fieldRepo, "findFieldById")
      .mockResolvedValue({ ...mockField, user_id: "otherUser" } as any);

    await expect(getCropSuitabilityService("user1", "1")).rejects.toMatchObject(
      {
        status: 403,
        message: "Forbidden",
        code: "FIELD_ACCESS_DENIED",
      },
    );
  });

  //  4. NO SOIL DATA
  it("should throw 400 if no soil data", async () => {
    jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
    jest.spyOn(soilRepo, "findLatestSoilByFieldId").mockResolvedValue(null);

    await expect(getCropSuitabilityService("user1", "1")).rejects.toMatchObject(
      {
        status: 400,
        message: "Run soil analysis first",
      },
    );
  });

  //  5. ENSURE LOWERCASE TEXTURE HANDLING
  it("should transform soil texture to lowercase", async () => {
    jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
    jest
      .spyOn(soilRepo, "findLatestSoilByFieldId")
      .mockResolvedValue(mockSoil as any);
    jest
      .spyOn(weatherService, "getWeatherData")
      .mockResolvedValue(mockWeather as any);

    const suitabilitySpy = jest
      .spyOn(suitabilityService, "calculateCropSuitability")
      .mockReturnValue(mockCrops as any);

    await getCropSuitabilityService("user1", "1");

    expect(suitabilitySpy).toHaveBeenCalledWith(
      {
        ph: 6.5,
        organicCarbon: 0.6,
        soilTexture: "loamy", //  lowercase verified
      },
      mockWeather,
    );
  });

  //  6. ERROR PROPAGATION (unexpected failure)
  it("should throw error if weather service fails", async () => {
    jest.spyOn(fieldRepo, "findFieldById").mockResolvedValue(mockField as any);
    jest
      .spyOn(soilRepo, "findLatestSoilByFieldId")
      .mockResolvedValue(mockSoil as any);
    jest
      .spyOn(weatherService, "getWeatherData")
      .mockRejectedValue(new Error("Weather API failed"));

    await expect(getCropSuitabilityService("user1", "1")).rejects.toThrow(
      "Weather API failed",
    );
  });
});
