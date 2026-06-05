import { calculateFertilizer, getFertilizerService } from "../../src/services/fertilizerService";
import { findFieldById } from "../../src/repositories/field.repository";
import { findLatestSoilByFieldId } from "../../src/repositories/soil.repository";
import { calculateCropSuitability } from "../../src/services/crop-suitability.service";
import { getWeatherData } from "../../src/services/weather.service";
import { getNDVIData } from "../../src/services/ndviService";
import { cropSchedules } from "../../src/data/applicationSchedules";

// Mock repositories and services
jest.mock("../../src/repositories/field.repository");
jest.mock("../../src/repositories/soil.repository");
jest.mock("../../src/services/crop-suitability.service");
jest.mock("../../src/services/weather.service");
jest.mock("../../src/services/ndviService");

const mockFindFieldById = findFieldById as jest.Mock;
const mockFindLatestSoilByFieldId = findLatestSoilByFieldId as jest.Mock;
const mockCalculateCropSuitability = calculateCropSuitability as jest.Mock;
const mockGetWeatherData = getWeatherData as jest.Mock;
const mockGetNDVIData = getNDVIData as jest.Mock;

describe("Fertilizer Service Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateFertilizer", () => {
    // LOW SOIL → HIGH FERTILIZER
    it("should recommend higher fertilizer for low soil nutrients", () => {
      const soil = { nitrogen: 10, phosphorus: 5, potassium: 5 };
      const result = calculateFertilizer(soil, "Wheat", 1);

      expect(result.nitrogenDeficit).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    // HIGH SOIL → LOW FERTILIZER
    it("should recommend less fertilizer for high soil nutrients", () => {
      const soil = { nitrogen: 200, phosphorus: 100, potassium: 100 };
      const result = calculateFertilizer(soil, "Wheat", 1);

      expect(result.totalQuantity).toBeLessThan(100);
    });

    // ZERO DEFICIT
    it("should return no fertilizer needed when no deficit", () => {
      const soil = { nitrogen: 500, phosphorus: 300, potassium: 300 };
      const result = calculateFertilizer(soil, "Wheat", 1);

      expect(result.recommendations.length).toBe(0);
      expect(result.applicationSchedule).toContain("No fertilizer needed");
      expect(result.scheduleSteps![0].stage).toBe("None Required");
    });

    // UNKNOWN CROP
    it("should throw error for unsupported crop", () => {
      const soil = { nitrogen: 50, phosphorus: 50, potassium: 50 };
      expect(() => calculateFertilizer(soil, "UnknownCrop", 1)).toThrow("Crop not supported");
    });

    // AREA SCALING
    it("should scale fertilizer based on field area", () => {
      const soil = { nitrogen: 10, phosphorus: 10, potassium: 10 };
      const result1 = calculateFertilizer(soil, "Wheat", 1);
      const result2 = calculateFertilizer(soil, "Wheat", 2);

      expect(result2.totalQuantity).toBeGreaterThan(result1.totalQuantity);
    });

    // DAP NITROGEN ADJUSTMENT
    it("should reduce urea due to DAP nitrogen contribution", () => {
      const soil = { nitrogen: 0, phosphorus: 0, potassium: 0 };
      const result = calculateFertilizer(soil, "Wheat", 1);
      const urea = result.recommendations.find((r) => r.name === "Urea");
      expect(urea?.quantity).toBeGreaterThan(0);
    });

    // TEST DIFFERENT CROPS & SCHEDULES
    it("should correctly handle schedule splits for Maize, Cotton, and Soybean", () => {
      const soil = { nitrogen: 10, phosphorus: 10, potassium: 10 };

      // Soybean (Single step schedule)
      const soyResult = calculateFertilizer(soil, "Soybean", 1);
      expect(soyResult.scheduleSteps!.length).toBe(1);

      // Maize (3 steps schedule)
      const maizeResult = calculateFertilizer(soil, "Maize", 1);
      expect(maizeResult.scheduleSteps!.length).toBe(3);

      // Cotton (3 steps schedule)
      const cottonResult = calculateFertilizer(soil, "Cotton", 1);
      expect(cottonResult.scheduleSteps!.length).toBe(3);
    });

    // TINY QUANTITY ROUNDING TO ZERO
    it("should handle extremely low deficits that round to zero in split calculations", () => {
      const soil = { nitrogen: 239.996, phosphorus: 149.995, potassium: 66.662 };
      const result = calculateFertilizer(soil, "Wheat", 1);
      expect(result.scheduleSteps!.length).toBeGreaterThan(0);
    });

    // TEST DEFAULT SCHEDULE FALLBACK BRANCH
    it("should use defaultSchedule when crop name is not found in cropSchedules", () => {
      const originalSchedules = [...cropSchedules];
      // Temporarily clear schedules to trigger the defaultSchedule fallback
      cropSchedules.length = 0;

      const soil = { nitrogen: 10, phosphorus: 10, potassium: 10 };
      const result = calculateFertilizer(soil, "Wheat", 1);

      expect(result.scheduleSteps![0].stage).toContain("Basal");
      expect(result.scheduleSteps![1].stage).toContain("Active Growth");

      // Restore schedules
      cropSchedules.push(...originalSchedules);
    });

    // TEST SINGLE-NUTRIENT DEFICIT BRANCHES (to cover undefined ureaRec, dapRec, mopRec branches)
    it("should handle single nutrient deficit profiles correctly to cover split branches", () => {
      // 1. Only Nitrogen is deficient (Urea present, DAP/MOP undefined)
      const soilOnlyN = { nitrogen: 10, phosphorus: 300, potassium: 300 };
      const resOnlyN = calculateFertilizer(soilOnlyN, "Wheat", 1);
      expect(resOnlyN.recommendations.some((r) => r.name === "Urea")).toBe(true);
      expect(resOnlyN.recommendations.some((r) => r.name === "DAP")).toBe(false);
      expect(resOnlyN.recommendations.some((r) => r.name === "MOP")).toBe(false);

      // 2. Only Phosphorus is deficient (DAP present, MOP undefined, Urea might be undefined if DAP nitrogen exceeds N requirement)
      const soilOnlyP = { nitrogen: 300, phosphorus: 10, potassium: 300 };
      const resOnlyP = calculateFertilizer(soilOnlyP, "Wheat", 1);
      expect(resOnlyP.recommendations.some((r) => r.name === "DAP")).toBe(true);
      expect(resOnlyP.recommendations.some((r) => r.name === "MOP")).toBe(false);

      // 3. Only Potassium is deficient (MOP present, Urea/DAP undefined)
      const soilOnlyK = { nitrogen: 300, phosphorus: 300, potassium: 10 };
      const resOnlyK = calculateFertilizer(soilOnlyK, "Wheat", 1);
      expect(resOnlyK.recommendations.some((r) => r.name === "MOP")).toBe(true);
      expect(resOnlyK.recommendations.some((r) => r.name === "Urea")).toBe(false);
      expect(resOnlyK.recommendations.some((r) => r.name === "DAP")).toBe(false);
    });
  });

  describe("getFertilizerService", () => {
    const mockField = {
      id: "field1",
      user_id: "user1",
      centroid_lat: 10,
      centroid_lng: 20,
      area: 2.5,
      polygon: {},
    };

    const mockSoilRecord = {
      data: {
        layers: [
          {
            ph: 6.5,
            organicCarbon: 12, // 1.2%
            clay: 20,
            sand: 40,
            nitrogen: 80,
            texture: "Loam",
          },
        ],
      },
    };

    it("should throw 404 when field is not found", async () => {
      mockFindFieldById.mockResolvedValue(null);

      await expect(getFertilizerService("user1", "field1", {})).rejects.toEqual({
        status: 404,
        message: "Field not found",
      });
    });

    it("should throw 403 when field does not belong to the user", async () => {
      mockFindFieldById.mockResolvedValue({ ...mockField, user_id: "other_user" });

      await expect(getFertilizerService("user1", "field1", {})).rejects.toEqual({
        status: 403,
        message: "Forbidden",
        code: "FIELD_ACCESS_DENIED",
      });
    });

    it("should use manual NPK override values when provided in the body", async () => {
      mockFindFieldById.mockResolvedValue(mockField);
      mockGetWeatherData.mockResolvedValue(null);
      mockGetNDVIData.mockResolvedValue(null);

      const body = {
        crop: "Wheat",
        soilN: 50,
        soilP: 30,
        soilK: 40,
      };

      const result = await getFertilizerService("user1", "field1", body);

      expect(result.crop).toBe("Wheat");
      expect(result.soilBaselines).toEqual({
        nitrogen: 50,
        phosphorus: 30,
        potassium: 40,
      });
    });

    it("should throw 400 when soil data is missing and NPK is not overridden", async () => {
      mockFindFieldById.mockResolvedValue(mockField);
      mockFindLatestSoilByFieldId.mockResolvedValue(null);

      await expect(getFertilizerService("user1", "field1", { crop: "Wheat" })).rejects.toEqual({
        status: 400,
        message: "run soil analysis first",
      });
    });

    it("should estimate soil P & K dynamically using different soil property branches", async () => {
      mockFindFieldById.mockResolvedValue(mockField);
      mockGetWeatherData.mockResolvedValue(null);
      mockGetNDVIData.mockResolvedValue(null);

      // Branch A: low ph (< 5.5), high sand (> 60), organicCarbon is null
      mockFindLatestSoilByFieldId.mockResolvedValue({
        data: {
          layers: [
            {
              ph: 5.0,
              organicCarbon: null,
              clay: 10,
              sand: 70,
              nitrogen: 60,
              texture: "SandyLoam",
            },
          ],
        },
      });

      const resA = await getFertilizerService("user1", "field1", { crop: "Wheat" });
      expect(resA.soilBaselines?.phosphorus).toBeLessThan(40); // phFactor = 0.6, ocFactor = 0.5 (fallback oc=1.5 / 1.5)
      expect(resA.soilBaselines?.potassium).toBe(35); // sand > 60 -> factor = 0.7 * 50 = 35

      // Branch B: moderate pH (5.8), high clay (> 35)
      mockFindLatestSoilByFieldId.mockResolvedValue({
        data: {
          layers: [
            {
              ph: 5.8,
              organicCarbon: 22,
              clay: 40,
              sand: 20,
              nitrogen: 70,
              texture: "Clay",
            },
          ],
        },
      });

      const resB = await getFertilizerService("user1", "field1", { crop: "Wheat" });
      expect(resB.soilBaselines?.phosphorus).toBeGreaterThan(0);
      expect(resB.soilBaselines?.potassium).toBe(60); // clay > 35 -> factor = 1.2 * 50 = 60

      // Branch C: moderate alkaline pH (7.5), normal texture
      mockFindLatestSoilByFieldId.mockResolvedValue({
        data: {
          layers: [
            {
              ph: 7.5,
              organicCarbon: 15,
              clay: 10,
              sand: 10,
              nitrogen: 70,
              texture: "Loam",
            },
          ],
        },
      });

      const resC = await getFertilizerService("user1", "field1", { crop: "Wheat" });
      expect(resC.soilBaselines?.phosphorus).toBeCloseTo(32); // phFactor = 0.8, oc = 15 -> ocFactor = 1.0 -> 40 * 0.8 * 1.0 = 32
      expect(resC.soilBaselines?.potassium).toBe(50); // normal texture -> factor = 1.0 -> 50
    });

    it("should trigger fallback values when layer property fields are null or undefined", async () => {
      mockFindFieldById.mockResolvedValue(mockField);
      mockGetWeatherData.mockResolvedValue(null);
      mockGetNDVIData.mockResolvedValue(null);

      mockFindLatestSoilByFieldId.mockResolvedValue({
        data: {
          layers: [
            {
              ph: null,
              organicCarbon: null,
              clay: null,
              sand: null,
              nitrogen: null,
              texture: "Loam",
            },
          ],
        },
      });

      const res = await getFertilizerService("user1", "field1", { crop: "Wheat" });
      expect(res.soilBaselines?.nitrogen).toBe(0); // layer.nitrogen || 0
      expect(res.soilBaselines?.phosphorus).toBe(40); // phFactor = 1.0, oc = 1.5 -> ocFactor = 1.0 -> 40 * 1.0 * 1.0 = 40
      expect(res.soilBaselines?.potassium).toBe(50); // clay = 20, sand = 40 -> factor = 1.0 -> 50
    });

    it("should infer crop using suitability model when no crop is requested", async () => {
      mockFindFieldById.mockResolvedValue(mockField);
      mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
      mockCalculateCropSuitability.mockReturnValue([{ name: "Maize", score: 90 }]);
      mockGetWeatherData.mockResolvedValue(null);
      mockGetNDVIData.mockResolvedValue(null);

      const result = await getFertilizerService("user1", "field1", {});
      expect(result.crop).toBe("Maize");
    });

    it("should handle undefined body parameter gracefully by falling back to empty object", async () => {
      mockFindFieldById.mockResolvedValue(mockField);
      mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
      mockCalculateCropSuitability.mockReturnValue([{ name: "Wheat", score: 90 }]);
      mockGetWeatherData.mockResolvedValue(null);
      mockGetNDVIData.mockResolvedValue(null);

      const result = await getFertilizerService("user1", "field1", undefined);
      expect(result.crop).toBe("Wheat");
    });

    it("should throw 400 if automatic crop inference fails to determine a crop", async () => {
      mockFindFieldById.mockResolvedValue(mockField);
      mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
      mockCalculateCropSuitability.mockReturnValue([]);
      mockGetWeatherData.mockResolvedValue(null);

      await expect(getFertilizerService("user1", "field1", {})).rejects.toEqual({
        status: 400,
        message: "Unable to determine crop",
      });
    });

    it("should throw 400 if inferring crop automatically but soil layer is missing", async () => {
      mockFindFieldById.mockResolvedValue(mockField);
      mockFindLatestSoilByFieldId.mockResolvedValue({
        data: { layers: [] },
      });

      await expect(
        getFertilizerService("user1", "field1", { soilN: 60, soilP: 40, soilK: 50 })
      ).rejects.toEqual({
        status: 400,
        message: "Run soil analysis first",
      });
    });

    describe("Weather Adjustments", () => {
      it("should handle missing weather telemetry gracefully", async () => {
        mockFindFieldById.mockResolvedValue(mockField);
        mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
        mockGetWeatherData.mockResolvedValue(undefined);
        mockGetNDVIData.mockResolvedValue(null);

        const result = await getFertilizerService("user1", "field1", { crop: "Wheat" });
        expect(result.liveDataAdjustments?.length).toBe(1);
        expect(result.liveDataAdjustments?.[0].type).toBe("info");
      });

      it("should add a warning adjustment if rainfall forecast is heavy (> 30mm)", async () => {
        mockFindFieldById.mockResolvedValue(mockField);
        mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
        mockGetWeatherData.mockResolvedValue({
          forecast: [
            { precipitation: 20 },
            { precipitation: 15 },
            { precipitation: 10 },
          ],
        });
        mockGetNDVIData.mockResolvedValue(null);

        const result = await getFertilizerService("user1", "field1", { crop: "Wheat" });
        expect(result.liveDataAdjustments?.[0].type).toBe("warning");
        expect(result.liveDataAdjustments?.[0].message).toContain("Delay Application");
      });

      it("should add irrigation advice if rainfall forecast is zero (0mm)", async () => {
        mockFindFieldById.mockResolvedValue(mockField);
        mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
        mockGetWeatherData.mockResolvedValue({
          forecast: [{ precipitation: 0 }, { precipitation: 0 }],
        });
        mockGetNDVIData.mockResolvedValue(null);

        const result = await getFertilizerService("user1", "field1", { crop: "Wheat" });
        expect(result.liveDataAdjustments?.[0].type).toBe("info");
        expect(result.liveDataAdjustments?.[0].message).toContain("Irrigation Advised");
      });

      it("should add a success adjustment for moderate rainfall", async () => {
        mockFindFieldById.mockResolvedValue(mockField);
        mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
        mockGetWeatherData.mockResolvedValue({
          forecast: [{ precipitation: 5 }, { precipitation: 10 }],
        });
        mockGetNDVIData.mockResolvedValue(null);

        const result = await getFertilizerService("user1", "field1", { crop: "Wheat" });
        expect(result.liveDataAdjustments?.[0].type).toBe("success");
        expect(result.liveDataAdjustments?.[0].message).toContain("Favorable Weather");
      });
    });

    describe("NDVI Satellite Adjustments", () => {
      it("should add no ndvi warning if averageNDVI is in the moderate normal range (0.45 - 0.65)", async () => {
        mockFindFieldById.mockResolvedValue(mockField);
        mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
        mockGetWeatherData.mockResolvedValue(null);
        mockGetNDVIData.mockResolvedValue({ averageNDVI: 0.55 });

        const result = await getFertilizerService("user1", "field1", { crop: "Wheat" });
        const ndviAdjustment = result.liveDataAdjustments?.find((a) => a.message.includes("NDVI"));
        expect(ndviAdjustment).toBeUndefined();
      });

      it("should add a warning adjustment for crop vegetative stress (NDVI < 0.45)", async () => {
        mockFindFieldById.mockResolvedValue(mockField);
        mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
        mockGetWeatherData.mockResolvedValue(null);
        mockGetNDVIData.mockResolvedValue({ averageNDVI: 0.35 });

        const result = await getFertilizerService("user1", "field1", { crop: "Wheat" });
        const ndviAdjustment = result.liveDataAdjustments?.find((a) => a.message.includes("NDVI"));
        expect(ndviAdjustment?.type).toBe("warning");
        expect(ndviAdjustment?.message).toContain("Crop Stress Detected");
      });

      it("should add a success adjustment for healthy vegetative canopy (NDVI > 0.65)", async () => {
        mockFindFieldById.mockResolvedValue(mockField);
        mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
        mockGetWeatherData.mockResolvedValue(null);
        mockGetNDVIData.mockResolvedValue({ averageNDVI: 0.75 });

        const result = await getFertilizerService("user1", "field1", { crop: "Wheat" });
        const ndviAdjustment = result.liveDataAdjustments?.find((a) => a.message.includes("NDVI"));
        expect(ndviAdjustment?.type).toBe("success");
        expect(ndviAdjustment?.message).toContain("Vigorous Vegetation");
      });

      it("should gracefully catch errors during NDVI queries without failing the request", async () => {
        mockFindFieldById.mockResolvedValue(mockField);
        mockFindLatestSoilByFieldId.mockResolvedValue(mockSoilRecord);
        mockGetWeatherData.mockResolvedValue(null);
        mockGetNDVIData.mockRejectedValue(new Error("Sentinel Hub API offline"));

        const result = await getFertilizerService("user1", "field1", { crop: "Wheat" });
        expect(result.crop).toBe("Wheat");
        expect(result.liveDataAdjustments?.length).toBe(1); // has weather adjustment, skipped NDVI
      });
    });
  });
});
