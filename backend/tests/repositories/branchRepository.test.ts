import {
  getAllBranchesFromDb,
  getBranchByIdFromDb,
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
});
