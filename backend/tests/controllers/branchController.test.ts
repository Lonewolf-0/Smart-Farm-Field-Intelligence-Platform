import request from "supertest";
import express from "express";
import {
  getAllBranches,
  getNearestBranches,
  getBranchById,
  getBranchPrices,
  comparePrices,
} from "../../src/controllers/branchController";
import * as service from "../../src/services/branchService";

const app = express();
app.use(express.json());

app.get("/branches", getAllBranches);
app.get("/branches/nearest", getNearestBranches);
app.get("/branches/compare/prices", comparePrices); // Placed before /branches/:id to prevent routing issues
app.get("/branches/:id", getBranchById);
app.get("/branches/:id/prices", getBranchPrices);

describe("Branch Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllBranches", () => {
    it("should return 200 with data on success", async () => {
      const mockRows = [{ id: "1", name: "Branch 1" }];
      jest.spyOn(service, "getAllBranchesService").mockResolvedValue(mockRows as any);

      const res = await request(app).get("/branches");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockRows);
    });

    it("should return 500 on error", async () => {
      jest.spyOn(service, "getAllBranchesService").mockRejectedValue(new Error("DB_ERROR"));

      const res = await request(app).get("/branches");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to fetch branches");
    });
  });

  describe("getNearestBranches", () => {
    it("should return 400 if lat or lng is missing", async () => {
      const res = await request(app).get("/branches/nearest?lat=10");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Missing lat or lng");
    });

    it("should return 200 and nearest branches on success", async () => {
      const mockNearest = [{ id: "1", name: "Branch 1", distance: 5 }];
      jest.spyOn(service, "findNearestBranches").mockResolvedValue(mockNearest as any);

      const res = await request(app).get("/branches/nearest?lat=10&lng=20&limit=3");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockNearest);
      expect(service.findNearestBranches).toHaveBeenCalledWith(10, 20, 3);
    });

    it("should use default limit of 5 if limit is not provided", async () => {
      const mockNearest = [{ id: "1", name: "Branch 1", distance: 5 }];
      jest.spyOn(service, "findNearestBranches").mockResolvedValue(mockNearest as any);

      const res = await request(app).get("/branches/nearest?lat=10&lng=20");

      expect(res.status).toBe(200);
      expect(service.findNearestBranches).toHaveBeenCalledWith(10, 20, 5);
    });

    it("should return 500 on error", async () => {
      jest.spyOn(service, "findNearestBranches").mockRejectedValue(new Error("DB_ERROR"));

      const res = await request(app).get("/branches/nearest?lat=10&lng=20");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to fetch nearest branches");
    });
  });

  describe("getBranchById", () => {
    it("should return 200 with branch data", async () => {
      const mockBranch = { id: "1", name: "Branch 1" };
      jest.spyOn(service, "getBranchByIdService").mockResolvedValue(mockBranch as any);

      const res = await request(app).get("/branches/1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBranch);
    });

    it("should return 404 if branch is not found", async () => {
      jest.spyOn(service, "getBranchByIdService").mockResolvedValue(null as any);

      const res = await request(app).get("/branches/1");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Branch not found");
    });

    it("should return 500 on error", async () => {
      jest.spyOn(service, "getBranchByIdService").mockRejectedValue(new Error("DB_ERROR"));

      const res = await request(app).get("/branches/1");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to fetch branch");
    });
  });

  describe("getBranchPrices", () => {
    it("should return 200 with products from branch", async () => {
      const mockBranchPrices = { id: "1", products: [{ name: "Fertilizer", price: 100 }] };
      jest.spyOn(service, "getBranchPricesService").mockResolvedValue(mockBranchPrices as any);

      const res = await request(app).get("/branches/1/prices");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockBranchPrices.products);
    });

    it("should return 404 if branch is not found", async () => {
      jest.spyOn(service, "getBranchPricesService").mockResolvedValue(null as any);

      const res = await request(app).get("/branches/1/prices");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Branch not found");
    });

    it("should return 500 on error", async () => {
      jest.spyOn(service, "getBranchPricesService").mockRejectedValue(new Error("DB_ERROR"));

      const res = await request(app).get("/branches/1/prices");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to fetch branch prices");
    });
  });

  describe("comparePrices", () => {
    it("should return 400 if product, lat, or lng is missing", async () => {
      const res = await request(app).get("/branches/compare/prices?lat=10&lng=20");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Missing product, lat, or lng");
    });

    it("should return 200 with sorted comparison data", async () => {
      const mockNearest = [
        {
          id: "1",
          name: "Branch A",
          distance: 10,
          products: [{ name: "Urea Fertilizer", price: 50, unit: "kg" }],
        },
        {
          id: "2",
          name: "Branch B",
          distance: 15,
          products: [{ name: "Urea Fertilizer", price: 40, unit: "kg" }, { name: "Other", price: 20 }],
        },
        {
          id: "3",
          name: "Branch C",
          distance: 5,
          products: [{ name: "Different Product", price: 30, unit: "kg" }],
        },
      ];

      jest.spyOn(service, "findNearestBranches").mockResolvedValue(mockNearest as any);

      const res = await request(app).get("/branches/compare/prices?product=urea&lat=10&lng=20");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Expected sorted by price ascending
      expect(res.body.data).toEqual([
        {
          branchId: "2",
          branchName: "Branch B",
          distance: 15,
          product: "Urea Fertilizer",
          price: 40,
          unit: "kg",
        },
        {
          branchId: "1",
          branchName: "Branch A",
          distance: 10,
          product: "Urea Fertilizer",
          price: 50,
          unit: "kg",
        },
      ]);
    });

    it("should return 500 on error", async () => {
      jest.spyOn(service, "findNearestBranches").mockRejectedValue(new Error("DB_ERROR"));

      const res = await request(app).get("/branches/compare/prices?product=urea&lat=10&lng=20");

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Failed to compare prices");
    });
  });
});
