import request from "supertest";
import express from "express";
import authRoutes from "../../src/routes/authRoutes";
import { pool } from "../../src/config/db";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

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
});

// close DB connection
afterAll(async () => {
  await pool.end();
});
