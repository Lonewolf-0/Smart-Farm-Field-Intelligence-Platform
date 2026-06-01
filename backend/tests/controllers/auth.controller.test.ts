import request from "supertest";
import express from "express";
import { registerController } from "../../src/controllers/auth.controller";
import * as service from "../../src/services/auth.service";

const app = express();
app.use(express.json());
app.post("/register", registerController);

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
