import { sendResponse } from "../../src/utils/response";

describe("sendResponse", () => {
  let res: any;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  //  SUCCESS RESPONSE WITH DATA
  it("should return success response with data", () => {
    const data = { user: "Ashish" };

    sendResponse(res, 200, "Success", data);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Success",
      data,
    });
  });

  // SUCCESS RESPONSE WITHOUT DATA
  it("should return success response without data", () => {
    sendResponse(res, 200, "Success");

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Success",
    });
  });

  // ERROR RESPONSE WITH ERROR MESSAGE
  it("should return error response with error", () => {
    sendResponse(res, 400, "Bad Request", null, "VALIDATION_ERROR");

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Bad Request",
      error: "VALIDATION_ERROR",
    });
  });

  // ERROR RESPONSE WITHOUT ERROR FIELD
  it("should return error response without error field if not provided", () => {
    sendResponse(res, 500, "Internal Server Error");

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });
  });

  // SUCCESS FALSE CHECK (STATUS >= 400)
  it("should set success = false for status >= 400", () => {
    sendResponse(res, 401, "Unauthorized");

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      }),
    );
  });

  // SUCCESS TRUE CHECK (STATUS < 400)
  it("should set success = true for status < 400", () => {
    sendResponse(res, 201, "Created");

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  it("should return success true with objectContaining matcher", () => {
    const data = { test: "value" };

    sendResponse(res, 200, "OK", data);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "OK",
      }),
    );
  });

  it("should include both data and error if both are provided", () => {
    const data = { user: "Ashish" };

    sendResponse(res, 200, "Mixed", data, "Some warning");

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Mixed",
      data,
      error: "Some warning",
    });
  });

  it("should use default statusCode and message", () => {
    sendResponse(res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Success",
    });
  });
});
