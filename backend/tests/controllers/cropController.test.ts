import { getCropSuitability } from "../../src/controllers/cropController";
import { sendResponse } from "../../src/utils/response";

import * as cropService from "../../src/services/cropService";

jest.mock("../../src/utils/response");

describe("Crop Controller (100% Coverage)", () => {
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

  //  1. SUCCESS CASE
  it("should return crop recommendations successfully", async () => {
    const mockCrops = [{ name: "Wheat", score: 90 }];

    jest
      .spyOn(cropService, "getCropSuitabilityService")
      .mockResolvedValue(mockCrops as any);

    await getCropSuitability(req, res);

    expect(cropService.getCropSuitabilityService).toHaveBeenCalledWith(
      "user1",
      "1",
    );

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Crop recommendation fetched",
      mockCrops,
    );
  });

  //  2. 404 ERROR
  it("should return 404 if field not found", async () => {
    jest.spyOn(cropService, "getCropSuitabilityService").mockRejectedValue({
      status: 404,
      message: "Field not found",
    });

    await getCropSuitability(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      404,
      "Field not found",
      null,
      "Field not found",
    );
  });

  //  3. 403 ERROR
  it("should return 403 if unauthorized", async () => {
    jest.spyOn(cropService, "getCropSuitabilityService").mockRejectedValue({
      status: 403,
      message: "Forbidden",
      code: "FIELD_ACCESS_DENIED",
    });

    await getCropSuitability(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      403,
      "Forbidden",
      null,
      "FIELD_ACCESS_DENIED",
    );
  });

  //  4. 400 ERROR (NO SOIL)
  it("should return 400 if no soil data", async () => {
    jest.spyOn(cropService, "getCropSuitabilityService").mockRejectedValue({
      status: 400,
      message: "Run soil analysis first",
    });

    await getCropSuitability(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      400,
      "Run soil analysis first",
      null,
      "Run soil analysis first",
    );
  });

  // 5. GENERIC ERROR (500 FALLBACK)
  it("should handle unexpected errors and return 500", async () => {
    jest
      .spyOn(cropService, "getCropSuitabilityService")
      .mockRejectedValue(new Error("Something broke"));

    await getCropSuitability(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      500,
      "Something broke",
      null,
      "Something broke",
    );
  });

  //  6. EDGE CASE — missing user (safety)
  it("should handle missing user gracefully", async () => {
    req.user = undefined;

    jest.spyOn(cropService, "getCropSuitabilityService").mockResolvedValue([]);

    await getCropSuitability(req, res);

    expect(cropService.getCropSuitabilityService).toHaveBeenCalledWith(
      undefined,
      "1",
    );

    expect(sendResponse).toHaveBeenCalled();
  });
});
