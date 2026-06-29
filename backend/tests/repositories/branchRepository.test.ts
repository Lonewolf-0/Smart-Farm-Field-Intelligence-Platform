import {
  getAllBranchesFromDb,
  getBranchByIdFromDb,
  getBranchPricesFromDb,
  getNearestBranchesFromDb,
} from "../../src/repositories/branchRepository";
import { pool } from "../../src/config/db";

jest.mock("../../src/config/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("Branch Repository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllBranchesFromDb", () => {
    it("should return all branches", async () => {
      const mockBranches = [
        { id: "1", name: "Branch 1" },
        { id: "2", name: "Branch 2" },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockBranches,
      });

      const result = await getAllBranchesFromDb();

      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM branches");
      expect(result).toEqual(mockBranches);
    });

    it("should return an empty array if no branches exist", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await getAllBranchesFromDb();

      expect(pool.query).toHaveBeenCalledWith("SELECT * FROM branches");
      expect(result).toEqual([]);
    });
  });

  describe("getBranchByIdFromDb", () => {
    it("should return a branch by id", async () => {
      const mockBranch = { id: "1", name: "Branch 1" };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockBranch],
      });

      const result = await getBranchByIdFromDb("1");

      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM branches WHERE id = $1",
        ["1"]
      );
      expect(result).toEqual(mockBranch);
    });

    it("should return null if branch not found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await getBranchByIdFromDb("2");

      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM branches WHERE id = $1",
        ["2"]
      );
      expect(result).toBeNull();
    });
  });

  describe("getBranchPricesFromDb", () => {
    it("should return branch prices (products) by id", async () => {
      const mockProducts = { products: [{ id: "p1", price: 10 }] };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockProducts],
      });

      const result = await getBranchPricesFromDb("1");

      expect(pool.query).toHaveBeenCalledWith(
        "SELECT products FROM branches WHERE id = $1",
        ["1"]
      );
      expect(result).toEqual(mockProducts);
    });

    it("should return null if branch not found for prices", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await getBranchPricesFromDb("2");

      expect(pool.query).toHaveBeenCalledWith(
        "SELECT products FROM branches WHERE id = $1",
        ["2"]
      );
      expect(result).toBeNull();
    });
  });

  describe("getNearestBranchesFromDb", () => {
    it("should return nearest branches", async () => {
      const mockBranches = [
        { id: "1", name: "Branch 1", distance: 1.5 },
        { id: "2", name: "Branch 2", distance: 3.0 },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockBranches,
      });

      const lat = 40.7128;
      const lng = -74.0060;
      const limit = 5;

      const result = await getNearestBranchesFromDb(lat, lng, limit);

      const expectedQuery = `
    SELECT *, (
      6371 * acos(
        cos(radians($2)) * cos(radians(latitude)) * cos(radians(longitude) - radians($1)) +
        sin(radians($2)) * sin(radians(latitude))
      )
    ) AS distance
    FROM branches
    ORDER BY distance ASC
    LIMIT $3
  `;

      expect(pool.query).toHaveBeenCalledWith(expectedQuery, [lng, lat, limit]);
      expect(result).toEqual(mockBranches);
    });

    it("should return an empty array if no nearest branches found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const lat = 40.7128;
      const lng = -74.0060;
      const limit = 5;

      const result = await getNearestBranchesFromDb(lat, lng, limit);

      expect(result).toEqual([]);
    });
  });
});
