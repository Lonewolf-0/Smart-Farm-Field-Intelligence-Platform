import request from "supertest";
import express from "express";
import authRoutes from "../../src/routes/auth.routes";
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

//  Close DB connection
afterAll(async () => {
  await pool.end();
});
