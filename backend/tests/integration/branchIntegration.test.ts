import request from "supertest";
import express from "express";
import branchRoutes from "../../src/routes/branchRoutes";
import { pool } from "../../src/config/db";
import * as branchService from "../../src/services/branchService";

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

const app = express();
app.use(express.json());
app.use("/api/branches", branchRoutes);

describe("Branch API Integration Tests", () => {
  const mockBranches = [
    {
      id: "branch1",
      name: "Branch A",
      latitude: 10.0,
      longitude: 20.0,
      address: "123 Street A",
      phone: "12345",
      services: ["serviceA"],
      products: [
        { name: "Fertilizer X", price: 10.5, unit: "kg" },
        { name: "Pesticide Y", price: 25.0, unit: "L" },
      ],
    },
    {
      id: "branch2",
      name: "Branch B",
      latitude: 10.1,
      longitude: 20.1,
      address: "456 Street B",
      phone: "67890",
      services: ["serviceB"],
      products: [
        { name: "Fertilizer X", price: 9.5, unit: "kg" },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/branches", () => {
    it("should return all branches successfully", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockBranches });

      const res = await request(app).get("/api/branches");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBranches);
      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM branches");
    });

    it("should return 500 if database query fails", async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app).get("/api/branches");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to fetch branches");
    });
  });

  describe("GET /api/branches/nearest", () => {
    it("should return 400 if lat or lng is missing", async () => {
      const res = await request(app).get("/api/branches/nearest?lat=10");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Missing lat or lng");
    });

    it("should return nearest branches successfully", async () => {
      const mockNearest = [
        { ...mockBranches[0], distance: 5.0 },
        { ...mockBranches[1], distance: 15.0 },
      ];
      jest.spyOn(branchService, "findNearestBranches").mockResolvedValueOnce(mockNearest);

      const res = await request(app).get("/api/branches/nearest?lat=10.0&lng=20.0&limit=2");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockNearest);
      expect(branchService.findNearestBranches).toHaveBeenCalledWith(10.0, 20.0, 2);
    });

    it("should fallback to limit 5 if limit query parameter is not provided", async () => {
      jest.spyOn(branchService, "findNearestBranches").mockResolvedValueOnce([]);

      const res = await request(app).get("/api/branches/nearest?lat=10.0&lng=20.0");

      expect(res.status).toBe(200);
      expect(branchService.findNearestBranches).toHaveBeenCalledWith(10.0, 20.0, 5);
    });

    it("should return 500 if branch service fails", async () => {
      jest.spyOn(branchService, "findNearestBranches").mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app).get("/api/branches/nearest?lat=10.0&lng=20.0");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to fetch nearest branches");
    });
  });

  describe("GET /api/branches/compare", () => {
    it("should return 400 if product, lat, or lng is missing", async () => {
      const res = await request(app).get("/api/branches/compare?product=Fertilizer&lat=10.0");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Missing product, lat, or lng");
    });

    it("should return comparison of products sorted by price ascending", async () => {
      const mockNearest = [
        { ...mockBranches[0], distance: 5.0 },
        { ...mockBranches[1], distance: 15.0 },
      ];
      jest.spyOn(branchService, "findNearestBranches").mockResolvedValueOnce(mockNearest);

      const res = await request(app).get("/api/branches/compare?product=Fertilizer&lat=10.0&lng=20.0");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([
        {
          branchId: "branch2",
          branchName: "Branch B",
          distance: 15.0,
          product: "Fertilizer X",
          price: 9.5,
          unit: "kg",
        },
        {
          branchId: "branch1",
          branchName: "Branch A",
          distance: 5.0,
          product: "Fertilizer X",
          price: 10.5,
          unit: "kg",
        },
      ]);
      expect(branchService.findNearestBranches).toHaveBeenCalledWith(10.0, 20.0, 10);
    });

    it("should handle cases where branches have no products listed", async () => {
      const mockNearest = [
        { ...mockBranches[0], products: undefined as any, distance: 5.0 },
      ];
      jest.spyOn(branchService, "findNearestBranches").mockResolvedValueOnce(mockNearest);

      const res = await request(app).get("/api/branches/compare?product=Fertilizer&lat=10.0&lng=20.0");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it("should return 500 if comparison service fails", async () => {
      jest.spyOn(branchService, "findNearestBranches").mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app).get("/api/branches/compare?product=Fertilizer&lat=10.0&lng=20.0");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to compare prices");
    });
  });

  describe("GET /api/branches/:id", () => {
    it("should return a branch by id", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [mockBranches[0]] });

      const res = await request(app).get("/api/branches/branch1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBranches[0]);
      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM branches WHERE id = $1", ["branch1"]);
    });

    it("should return 404 if branch does not exist", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get("/api/branches/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Branch not found");
    });

    it("should return 500 if database query fails", async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app).get("/api/branches/branch1");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to fetch branch");
    });
  });

  describe("GET /api/branches/:id/prices", () => {
    it("should return products/prices for a branch", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ products: mockBranches[0].products }] });

      const res = await request(app).get("/api/branches/branch1/prices");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBranches[0].products);
      expect(pool.query).toHaveBeenCalledWith("SELECT products FROM branches WHERE id = $1", ["branch1"]);
    });

    it("should return 404 if branch for prices does not exist", async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get("/api/branches/nonexistent/prices");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Branch not found");
    });

    it("should return 500 if database query for prices fails", async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app).get("/api/branches/branch1/prices");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to fetch branch prices");
    });
  });
});
