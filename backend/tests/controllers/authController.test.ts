import request from "supertest";
import express from "express";
import {
  registerController,
  loginController,
  getMe,
} from "../../src/controllers/authController";
import * as service from "../../src/services/authService";

const app = express();
app.use(express.json());

// routes
app.post("/register", registerController);
app.post("/login", loginController);
app.get("/me", (req: any, res) => getMe(req, res)); // manual route

describe("Auth Controller - Register", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return 201 on success", async () => {
    jest.spyOn(service, "registerUser").mockResolvedValue({
      user: { id: "1" },
      token: "token",
    } as any);

    const res = await request(app).post("/register").send({
      email: "test@test.com",
      password: "123",
    });

    expect(res.status).toBe(201);
  });

  it("should return 400 if email already exists", async () => {
    jest
      .spyOn(service, "registerUser")
      .mockRejectedValue(new Error("EMAIL_ALREADY_EXISTS"));

    const res = await request(app).post("/register").send({
      email: "test@test.com",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("should return 500 for unknown errors", async () => {
    jest
      .spyOn(service, "registerUser")
      .mockRejectedValue(new Error("UNKNOWN_ERROR"));

    const loggerSpy = jest.spyOn(require("../../src/utils/logger").default, "error").mockImplementation(() => {});

    const res = await request(app).post("/register").send({});

    expect(res.status).toBe(500);
    expect(loggerSpy).toHaveBeenCalled();

    loggerSpy.mockRestore();
  });
});

// ============================================================
// ✅ LOGIN CONTROLLER
// ============================================================

describe("Auth Controller - Login", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should login successfully", async () => {
    jest.spyOn(service, "loginUser").mockResolvedValue({
      user: { id: "1" },
      token: "token",
    } as any);

    const res = await request(app).post("/login").send({
      email: "test@test.com",
      password: "123",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 401 for invalid credentials", async () => {
    jest
      .spyOn(service, "loginUser")
      .mockRejectedValue(new Error("INVALID_CREDENTIALS"));

    const res = await request(app).post("/login").send({
      email: "test@test.com",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid Email");
  });

  // Invalid Password
  it("should return 401 for invalid password", async () => {
    jest
      .spyOn(service, "loginUser")
      .mockRejectedValue(new Error("INVALID_PASSWORD"));

    const res = await request(app).post("/login").send({
      email: "test@test.com",
      password: "wrong",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid Password");
  });

  it("should return 500 and log error", async () => {
    jest.spyOn(service, "loginUser").mockRejectedValue(new Error("UNKNOWN"));

    const loggerSpy = jest.spyOn(require("../../src/utils/logger").default, "error").mockImplementation(() => {});

    const res = await request(app).post("/login").send({});

    expect(res.status).toBe(500);
    expect(loggerSpy).toHaveBeenCalled();

    loggerSpy.mockRestore();
  });
});

//get me controller

describe("Auth Controller - getMe", () => {
  // SUCCESS
  it("should return current user", async () => {
    const app = express();

    app.get("/me", (req: any, res) => {
      req.user = { id: "1", email: "test@test.com" };
      return getMe(req, res);
    });

    const res = await request(app).get("/me");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // UNAUTHORIZED
  it("should return 401 when user missing", async () => {
    const app = express();

    app.get("/me", (req: any, res) => {
      return getMe(req, res); // 👈 NO user
    });

    const res = await request(app).get("/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  // ERROR CASE
  it("should return 500 on error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const app = express();

    app.get("/me", () => {
      throw new Error("FAIL");
    });

    const res = await request(app).get("/me");

    expect(res.status).toBe(500);

    consoleSpy.mockRestore();
  });
});
