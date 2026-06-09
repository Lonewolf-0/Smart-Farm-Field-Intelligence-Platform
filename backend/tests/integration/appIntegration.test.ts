import request from "supertest";
import app from "../../src/index";

describe("App Root Integration Tests", () => {
  it("should return 200 and health check status for GET /", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "ok",
      message: "Smart Farm backend (TypeScript) is running",
    });
  });
});
