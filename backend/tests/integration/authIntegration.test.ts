import request from "supertest";
import express from "express";
import authRoutes from "../../src/routes/authRoutes";
import { pool } from "../../src/config/db";
import jwt from "jsonwebtoken";
import { ENV } from "../../src/config/env";
import { getMe } from "../../src/controllers/authController";
import { authenticate } from "../../src/middlewares/authMiddleware";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/test-getme-unauthorized", getMe);
app.get("/test-getme-error", (req, res) => {
  Object.defineProperty(req, "user", {
    get() {
      throw new Error("Simulated getMe error");
    }
  });
  return getMe(req as any, res);
});
app.get("/api/auth/me", authenticate, getMe);
app.get("/api/auth/protected", authenticate, (req: any, res) => {
  res.json({ message: "You are authenticated", user: req.user });
});

describe("Auth Integration", () => {
  it("should register user end-to-end", async () => {
    const email = `test_${Date.now()}@test.com`;

    const res = await request(app).post("/api/auth/register").send({
      name: "Integration User",
      email,
      password: "123456",
    });

    expect(res.status).toBe(201);
  });

  it("should return 400 if registering with an email that already exists", async () => {
    const duplicateEmail = `dup_${Date.now()}@test.com`;

    await request(app).post("/api/auth/register").send({
      name: "First User",
      email: duplicateEmail,
      password: "password123",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Second User",
      email: duplicateEmail,
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("should return 500 in registerController if database query fails", async () => {
    const dbSpy = (jest.spyOn(pool, "query") as any).mockRejectedValueOnce(new Error("DB register error"));
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app).post("/api/auth/register").send({
      name: "Fail User",
      email: "fail@test.com",
      password: "password123",
    });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    dbSpy.mockRestore();
    errSpy.mockRestore();
  });
});

describe("Auth Input Validation - Register", () => {
  it("should fail validation if name is empty", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "   ",
      email: "val@test.com",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Name is required");
  });

  it("should fail validation if name is too short", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "ab",
      email: "val@test.com",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Name must be at least 3 characters");
  });

  it("should fail validation if email is empty", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Valid Name",
      email: "",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email is required");
  });

  it("should fail validation if email format is invalid", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Valid Name",
      email: "invalid-email",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email format");
  });

  it("should fail validation if password is empty", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Valid Name",
      email: "val@test.com",
      password: "",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Password is required");
  });

  it("should fail validation if password is too short", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Valid Name",
      email: "val@test.com",
      password: "12345",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Password must be at least 6 characters");
  });
});

describe("Auth Integration - Login", () => {
  let email: string;

  beforeAll(async () => {
    email = `login_${Date.now()}@test.com`;

    // register first
    await request(app).post("/api/auth/register").send({
      name: "Test User",
      email,
      password: "123456",
    });
  });

  //  SUCCESS LOGIN
  it("should login successfully", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email,
      password: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
  });

  //  INVALID EMAIL
  it("should fail with invalid email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "wrong@test.com",
      password: "123456",
    });

    expect(res.status).toBe(401);
  });

  // WRONG PASSWORD
  it("should fail with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email,
      password: "wrong123",
    });

    expect(res.status).toBe(401);
  });

  it("should return 500 in loginController if database query fails", async () => {
    const dbSpy = (jest.spyOn(pool, "query") as any).mockRejectedValueOnce(new Error("DB login error"));
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const res = await request(app).post("/api/auth/login").send({
      email: "login_fail@test.com",
      password: "password123",
    });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);

    dbSpy.mockRestore();
    logSpy.mockRestore();
  });
});

describe("Auth Input Validation - Login", () => {
  it("should fail validation if email is empty", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email is required");
  });

  it("should fail validation if email format is invalid", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "invalid-email",
      password: "password123",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email format");
  });

  it("should fail validation if password is empty", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "val@test.com",
      password: "",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Password is required");
  });

  it("should fail validation if password is too short", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "val@test.com",
      password: "12345",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Password must be at least 6 characters");
  });
});

describe("Auth Integration - Protected Endpoints", () => {
  let email: string;
  let validToken: string;
  let user_id: number;

  beforeAll(async () => {
    email = `protected_${Date.now()}@test.com`;

    // 1. Register user
    await request(app).post("/api/auth/register").send({
      name: "Protected User",
      email,
      password: "password123",
    });

    // 2. Login to get token
    const res = await request(app).post("/api/auth/login").send({
      email,
      password: "password123",
    });

    validToken = res.body.data.token;
  });

  describe("GET /api/auth/me", () => {
    it("should return the authenticated user details", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(email);
      expect(res.body.data.name).toBe("Protected User");
    });

    it("should return 401 if token is missing", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("NO_TOKEN");
    });

    it("should return 401 if token is invalid", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalidtoken");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("INVALID_TOKEN");
    });

    it("should return 401 if user inside token does not exist in DB", async () => {
      const fakeToken = jwt.sign({ userId: -1 }, ENV.JWT_SECRET);
      
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${fakeToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("USER_NOT_FOUND");
    });

    it("should return 401 if user is missing on request (e.g. no auth middleware)", async () => {
      const res = await request(app).get("/test-getme-unauthorized");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Missing user");
    });

    it("should return 500 if unexpected error occurs in getMe", async () => {
      const res = await request(app).get("/test-getme-error");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/auth/protected", () => {
    it("should succeed and return message if authenticated", async () => {
      const res = await request(app)
        .get("/api/auth/protected")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("You are authenticated");
      expect(res.body.user.email).toBe(email);
    });
  });
});

// close DB connection
afterAll(async () => {
  await pool.end();
});
