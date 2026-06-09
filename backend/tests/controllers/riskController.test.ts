import request from "supertest";
import express from "express";

jest.mock("../../src/services/riskAnalysisService", () => ({
  getRiskAnalysisService: jest.fn(),
}));

import { getRiskAlerts } from "../../src/controllers/riskController";
import { getRiskAnalysisService } from "../../src/services/riskAnalysisService";

describe("Risk Controller", () => {
  const createApp = (user?: any) => {
    const app = express();
    app.use(express.json());

    app.get("/risk/:fieldId", (req: any, res) => {
      req.user = user;
      return getRiskAlerts(req, res);
    });

    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  //success case
  it("should return 200 with risk data", async () => {
    (getRiskAnalysisService as jest.Mock).mockResolvedValue([{ risk: "High" }]);

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/risk/field1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([{ risk: "High" }]);

    expect(getRiskAnalysisService).toHaveBeenCalledWith("user1", "field1");
  });

  //error with custom status message
  it("should handle custom error with status, message, and code", async () => {
    (getRiskAnalysisService as jest.Mock).mockRejectedValue({
      status: 403,
      message: "Forbidden",
      code: "FIELD_ACCESS_DENIED",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/risk/field1");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Forbidden");
    expect(res.body.error).toBe("FIELD_ACCESS_DENIED");
  });

  //error with only message
  it("should fallback to 500 if status is missing", async () => {
    (getRiskAnalysisService as jest.Mock).mockRejectedValue({
      message: "Something failed",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/risk/field1");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Something failed");
    expect(res.body.error).toBe("Something failed");
  });

  //error with no message
  it("should fallback to default error message", async () => {
    (getRiskAnalysisService as jest.Mock).mockRejectedValue({});

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/risk/field1");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Risk analysis failed");
  });

  //edge case
  it("should fallback error to message when code missing", async () => {
    (getRiskAnalysisService as jest.Mock).mockRejectedValue({
      status: 400,
      message: "Bad request",
    });

    const app = createApp({ id: "user1" });

    const res = await request(app).get("/risk/field1");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Bad request");
  });
});
