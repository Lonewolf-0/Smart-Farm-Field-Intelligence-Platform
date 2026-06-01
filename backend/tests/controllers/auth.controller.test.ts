import request from "supertest";
import express from "express";
import {
  registerController,
  loginController,
} from "../../src/controllers/auth.controller";
import * as service from "../../src/services/auth.service";

const app = express();
app.use(express.json());
app.post("/register", registerController);
app.post("/login", loginController);

describe("Auth Controller", () => {
  it("should return 201 on success", async () => {
    jest.spyOn(service, "registerUser").mockResolvedValue({
      user: {
        id: "1",
        email: "test@test.com",
        name: "Ashish",
        createdAt: new Date().toISOString(),
      },
      token: "token",
    });

    const res = await request(app).post("/register").send({
      name: "Ashish",
      email: "test@test.com",
      password: "123456",
    });

    expect(res.status).toBe(201);
  });

  it("should return 400 if email already exists", async () => {
    jest
      .spyOn(service, "registerUser")
      .mockRejectedValue(new Error("EMAIL_ALREADY_EXISTS"));

    const res = await request(app).post("/register").send({
      name: "Ashish",
      email: "test@test.com",
      password: "123456",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email already exists");
    expect(res.body.error).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("should return 500 for unknown errors", async () => {
    jest
      .spyOn(service, "registerUser")
      .mockRejectedValue(new Error("UNKNOWN_ERROR"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const res = await request(app).post("/register").send({
      name: "Ashish",
      email: "test@test.com",
      password: "123456",
    });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Internal server error");
    expect(res.body.error).toBe("UNKNOWN_ERROR");

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("Auth Controller - Login", () => {
  const mockResponse = {
    user: {
      id: "1",
      email: "test@test.com",
      name: "Ashish",
      createdAt: new Date().toISOString(),
    },
    token: "token",
  };

  //  SUCCESS
  it("should login successfully", async () => {
    jest.spyOn(service, "loginUser").mockResolvedValue(mockResponse);

    const res = await request(app).post("/login").send({
      email: "test@test.com",
      password: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  //  INVALID CREDENTIALS
  it("should return 401 for invalid credentials", async () => {
    jest
      .spyOn(service, "loginUser")
      .mockRejectedValue(new Error("INVALID_CREDENTIALS"));

    const res = await request(app).post("/login").send({
      email: "test@test.com",
      password: "wrong",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid Email");
  });

  // SERVER ERROR
  it("should return 500 for unknown error", async () => {
    jest.spyOn(service, "loginUser").mockRejectedValue(new Error("UNKNOWN"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const res = await request(app).post("/login").send({
      email: "test@test.com",
      password: "123456",
    });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    consoleSpy.mockRestore();
  });
});
