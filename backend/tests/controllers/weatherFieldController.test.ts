import { getFieldWeather } from "../../src/controllers/weatherController";
import { sendResponse } from "../../src/utils/response";
import * as repo from "../../src/repositories/fieldRepository";
import * as weatherService from "../../src/services/weatherService";

jest.mock("../../src/utils/response");

describe("getFieldWeather Controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      params: { fieldId: "1" },
      user: { id: "user1" },
    };
    res = {};

    jest.clearAllMocks();
  });

  // SUCCESS
  it("should return weather for valid field", async () => {
    jest.spyOn(repo, "findFieldById").mockResolvedValue({
      id: "1",
      user_id: "user1",
      centroid_lat: 18,
      centroid_lng: 73,
    } as any);

    jest
      .spyOn(weatherService, "getWeatherData")
      .mockResolvedValue({ temperature: 30 } as any);

    await getFieldWeather(req, res);

    expect(sendResponse).toHaveBeenCalledWith(res, 200, "Weather fetched", {
      temperature: 30,
    });
  });

  // 404
  it("should return 404 if field not found", async () => {
    jest.spyOn(repo, "findFieldById").mockResolvedValue(null);

    await getFieldWeather(req, res);

    expect(sendResponse).toHaveBeenCalledWith(res, 404, "Field not found");
  });

  // 403
  it("should return 403 if user does not own field", async () => {
    jest.spyOn(repo, "findFieldById").mockResolvedValue({
      id: "1",
      user_id: "otherUser",
    } as any);

    await getFieldWeather(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      403,
      "Forbidden",
      null,
      "FIELD_ACCESS_DENIED",
    );
  });

  // 500
  it("should handle internal errors", async () => {
    jest.spyOn(repo, "findFieldById").mockRejectedValue(new Error("DB FAIL"));

    await getFieldWeather(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      500,
      "Failed to fetch weather",
      null,
      "DB FAIL",
    );
  });
});
