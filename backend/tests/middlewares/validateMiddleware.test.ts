import { validate } from "../../src/middlewares/validateMiddleware";
import { sendResponse } from "../../src/utils/response";

jest.mock("../../src/utils/response");

describe("validate middleware", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { body: {} };
    res = {};
    next = jest.fn();

    (sendResponse as jest.Mock).mockClear();
  });

  //  CASE 1: VALIDATION FAILS (error exists)
  it("should return 400 if validation fails", () => {
    const mockValidator = jest.fn().mockReturnValue("Validation error");

    const middleware = validate(mockValidator);

    middleware(req, res, next);

    expect(mockValidator).toHaveBeenCalledWith(req.body);
    expect(sendResponse).toHaveBeenCalledWith(res, 400, "Validation error");
    expect(next).not.toHaveBeenCalled();
  });

  // CASE 2: VALIDATION PASSES (no error)
  it("should call next() if validation passes", () => {
    const mockValidator = jest.fn().mockReturnValue(null);

    const middleware = validate(mockValidator);

    middleware(req, res, next);

    expect(mockValidator).toHaveBeenCalledWith(req.body);
    expect(sendResponse).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
