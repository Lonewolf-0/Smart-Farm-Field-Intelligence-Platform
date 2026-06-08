import { authenticate } from "../../src/middlewares/authMiddleware";
import { sendResponse } from "../../src/utils/response";
import jwt from "jsonwebtoken";
import { pool } from "../../src/config/db";

jest.mock("../../src/utils/response");
jest.mock("jsonwebtoken");
jest.mock("../../src/config/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("authenticate middleware", () => {
  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();

    (sendResponse as jest.Mock).mockClear();
  });

  //  NO TOKEN
  it("should return 401 if no token provided", async () => {
    await authenticate(req, res, next);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      401,
      "Unauthorized",
      null,
      "NO_TOKEN",
    );
  });

  // INVALID FORMAT
  it("should return 401 if not Bearer token", async () => {
    req.headers.authorization = "InvalidToken";

    await authenticate(req, res, next);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      401,
      "Unauthorized",
      null,
      "NO_TOKEN",
    );
  });

  // INVALID TOKEN
  it("should return 401 if token is invalid", async () => {
    req.headers.authorization = "Bearer token";

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid");
    });

    await authenticate(req, res, next);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      401,
      "Unauthorized",
      null,
      "INVALID_TOKEN",
    );
  });

  // USER NOT FOUND
  it("should return 401 if user not found", async () => {
    req.headers.authorization = "Bearer token";

    (jwt.verify as jest.Mock).mockReturnValue({ userId: "1" });
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

    await authenticate(req, res, next);

    expect(sendResponse).toHaveBeenCalledWith(
      res,
      401,
      "Unauthorized",
      null,
      "USER_NOT_FOUND",
    );
  });

  // SUCCESS
  it("should attach user and call next", async () => {
    req.headers.authorization = "Bearer token";

    const mockUser = {
      id: "1",
      email: "test@test.com",
    };

    (jwt.verify as jest.Mock).mockReturnValue({ userId: "1" });
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [mockUser],
    });

    await authenticate(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
