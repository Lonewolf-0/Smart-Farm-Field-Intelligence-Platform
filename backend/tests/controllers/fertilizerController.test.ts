import { getFertilizerPlan } from "../../src/controllers/fertilizerController";
import { sendResponse } from "../../src/utils/response";
import * as fertilizerService from "../../src/services/fertilizerService";

jest.mock("../../src/utils/response");
jest.mock("../../src/services/fertilizerService");

describe("Fertilizer Controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      params: { fieldId: "field-123" },
      user: { id: "user-123" },
      body: { crop: "Wheat" },
    };

    res = {};

    jest.clearAllMocks();
  });

  // 1. SUCCESS CASE
  it("should return the calculated fertilizer plan successfully", async () => {
    const mockPlan = { crop: "Wheat", recommendations: [], totalQuantity: 0 };
    jest
      .spyOn(fertilizerService, "getFertilizerService")
      .mockResolvedValue(mockPlan as any);

    await getFertilizerPlan(req, res);

    expect(fertilizerService.getFertilizerService).toHaveBeenCalledWith(
      "user-123",
      "field-123",
      req.body,
    );

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      200,
      "Fertilizer plan calculated",
      mockPlan,
    );
  });

  // 2. 404 FIELD NOT FOUND
  it("should return 404 status when field is not found", async () => {
    jest.spyOn(fertilizerService, "getFertilizerService").mockRejectedValue({
      status: 404,
      message: "Field not found",
    });

    await getFertilizerPlan(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      404,
      "Field not found",
      null,
      "Field not found",
    );
  });

  // 3. 403 FORBIDDEN
  it("should return 403 status when access is forbidden", async () => {
    jest.spyOn(fertilizerService, "getFertilizerService").mockRejectedValue({
      status: 403,
      message: "Forbidden",
      code: "FIELD_ACCESS_DENIED",
    });

    await getFertilizerPlan(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      403,
      "Forbidden",
      null,
      "FIELD_ACCESS_DENIED",
    );
  });

  // 4. Unexpected Standard Error (500 Fallback)
  it("should handle generic errors and fallback to 500 status", async () => {
    jest
      .spyOn(fertilizerService, "getFertilizerService")
      .mockRejectedValue(new Error("Database crash"));

    await getFertilizerPlan(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      500,
      "Database crash",
      null,
      "Database crash",
    );
  });

  // 5. Empty Error object (Tests fallback values status=500, message="Failed to calculate fertilizer")
  it("should handle empty error object by falling back to default status and messages", async () => {
    jest.spyOn(fertilizerService, "getFertilizerService").mockRejectedValue({});

    await getFertilizerPlan(req, res);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      500,
      "Failed to calculate fertilizer",
      null,
      undefined,
    );
  });
});
