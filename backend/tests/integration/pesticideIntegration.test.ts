import request from "supertest";
import express from "express";
import analysisRoutes from "../../src/routes/analysisRoutes";
import * as fieldRepo from "../../src/repositories/fieldRepository";
import * as weatherService from "../../src/services/weatherService";
import * as pesticideService from "../../src/services/pesticideService";
import * as cropService from "../../src/services/cropService";

let mockUser: any = { id: "user1" };

jest.mock("../../src/middlewares/authMiddleware", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

const app = express();
app.use(express.json());
app.use("/api/analysis", analysisRoutes);

describe("Pesticide API Integration Tests", () => {
  const mockField = {
    id: "field1",
    user_id: "user1",
    centroid_lat: 10,
    centroid_lng: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: "user1" };
  });

  describe("POST /api/analysis/:fieldId/pesticide", () => {
    it("should return 404 when field is not found", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(null);

      const res = await request(app).post("/api/analysis/field1/pesticide").send({ crop: "rice" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Field not found");
    });

    it("should return 403 when not owner", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce({
        ...mockField,
        user_id: "otherUser",
      } as any);

      const res = await request(app).post("/api/analysis/field1/pesticide").send({ crop: "rice" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("FIELD_ACCESS_DENIED");
    });

    it("should return 400 when crop cannot be determined", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(cropService, "getCropSuitabilityService").mockResolvedValueOnce([]);

      const res = await request(app).post("/api/analysis/field1/pesticide").send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Could not determine a target crop. Please provide one.");
    });

    it("should use crop and growthStage from request body successfully", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(pesticideService, "assessPestRisk").mockReturnValueOnce([{ risk: "High" }] as any);

      const res = await request(app)
        .post("/api/analysis/field1/pesticide")
        .send({ crop: "rice", growthStage: "early" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.crop).toBe("rice");
      expect(res.body.data.growthStage).toBe("early");
      expect(res.body.data.assessments).toEqual([{ risk: "High" }]);
    });

    it("should fallback to crop from suitability service and set default growthStage to Unknown", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(cropService, "getCropSuitabilityService").mockResolvedValueOnce([{ name: "wheat" }] as any);
      jest.spyOn(pesticideService, "assessPestRisk").mockReturnValueOnce([] as any);

      const res = await request(app).post("/api/analysis/field1/pesticide").send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.crop).toBe("wheat");
      expect(res.body.data.growthStage).toBe("Unknown");
    });

    it("should handle error with custom status and messages in catch block", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockRejectedValueOnce({
        status: 400,
        message: "Bad request",
        code: "ERR_BAD_REQUEST",
      });

      const res = await request(app).post("/api/analysis/field1/pesticide").send({ crop: "rice" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Bad request");
      expect(res.body.error).toBe("ERR_BAD_REQUEST");
    });

    it("should fallback to default error message in catch block", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockRejectedValueOnce({});

      const res = await request(app).post("/api/analysis/field1/pesticide").send({ crop: "rice" });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Failed to fetch pesticide recommendations");
    });

    it("should return Winter season when mock date is in winter", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(pesticideService, "assessPestRisk").mockReturnValueOnce([] as any);

      const dateSpy = jest.spyOn(global.Date.prototype, "getMonth").mockReturnValueOnce(0);

      const res = await request(app).post("/api/analysis/field1/pesticide").send({ crop: "rice" });

      expect(res.status).toBe(200);
      expect(res.body.data.season).toBe("Winter");

      dateSpy.mockRestore();
    });

    it("should return Spring season when mock date is in spring", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(pesticideService, "assessPestRisk").mockReturnValueOnce([] as any);

      const dateSpy = jest.spyOn(global.Date.prototype, "getMonth").mockReturnValueOnce(4);

      const res = await request(app).post("/api/analysis/field1/pesticide").send({ crop: "rice" });

      expect(res.status).toBe(200);
      expect(res.body.data.season).toBe("Spring / Warm Dry Weather");

      dateSpy.mockRestore();
    });

    it("should return Monsoon season when mock date is in monsoon", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(pesticideService, "assessPestRisk").mockReturnValueOnce([] as any);

      const dateSpy = jest.spyOn(global.Date.prototype, "getMonth").mockReturnValueOnce(7);

      const res = await request(app).post("/api/analysis/field1/pesticide").send({ crop: "rice" });

      expect(res.status).toBe(200);
      expect(res.body.data.season).toBe("Monsoon");

      dateSpy.mockRestore();
    });

    it("should handle undefined request body by falling back to empty object", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(cropService, "getCropSuitabilityService").mockResolvedValueOnce([{ name: "wheat" }] as any);
      jest.spyOn(pesticideService, "assessPestRisk").mockReturnValueOnce([] as any);

      const res = await request(app)
        .post("/api/analysis/field1/pesticide")
        .set("Content-Type", "text/plain")
        .send("some plain text");

      expect(res.status).toBe(200);
      expect(res.body.data.growthStage).toBe("Unknown");
      expect(res.body.data.crop).toBe("wheat");
    });

    it("should return Winter season when mock date is late in the year (e.g. October, month 9)", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(pesticideService, "assessPestRisk").mockReturnValueOnce([] as any);

      const dateSpy = jest.spyOn(global.Date.prototype, "getMonth").mockReturnValueOnce(9);

      const res = await request(app).post("/api/analysis/field1/pesticide").send({ crop: "rice" });

      expect(res.status).toBe(200);
      expect(res.body.data.season).toBe("Winter");

      dateSpy.mockRestore();
    });

    it("should handle completely missing req.body when req.body is undefined", async () => {
      jest.spyOn(fieldRepo, "findFieldById").mockResolvedValueOnce(mockField as any);
      jest.spyOn(weatherService, "getWeatherData").mockResolvedValueOnce({} as any);
      jest.spyOn(cropService, "getCropSuitabilityService").mockResolvedValueOnce([{ name: "wheat" }] as any);
      jest.spyOn(pesticideService, "assessPestRisk").mockReturnValueOnce([] as any);

      const customApp = express();
      customApp.use((req: any, _res, next) => {
        req.user = { id: "user1" };
        req.body = undefined; // Force body to be undefined
        next();
      });
      customApp.use("/api/analysis", analysisRoutes);

      const res = await request(customApp).post("/api/analysis/field1/pesticide");

      expect(res.status).toBe(200);
      expect(res.body.data.growthStage).toBe("Unknown");
      expect(res.body.data.crop).toBe("wheat");
    });
  });
});
