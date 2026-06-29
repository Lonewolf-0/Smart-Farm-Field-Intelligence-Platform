import {
  findFieldById,
  findFieldByIdAndUserId,
  createField,
  getFieldsByUserId,
  deleteField,
  updateFieldName,
} from "../../src/repositories/fieldRepository";

import { pool } from "../../src/config/db";

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

describe("Field Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // findFieldById
  // ===============================
  describe("findFieldById", () => {
    it("should return field when found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: "1", user_id: "u1" }],
      });

      const result = await findFieldById("1");

      expect(result).toEqual({ id: "1", user_id: "u1" });
      expect(pool.query).toHaveBeenCalled();
    });

    it("should return null when field not found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await findFieldById("1");

      expect(result).toBeNull();
    });
  });

  // findFieldByIdAndUserId
  // ===============================
  describe("findFieldByIdAndUserId", () => {
    it("should return field when found for specific user", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: "1", polygon: {} }],
      });

      const result = await findFieldByIdAndUserId("1", "u1");

      expect(result).toEqual({ id: "1", polygon: {} });
      expect(pool.query).toHaveBeenCalledWith(
        `SELECT id, polygon FROM fields WHERE id = $1 AND user_id = $2`,
        ["1", "u1"]
      );
    });

    it("should return null when field not found for specific user", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await findFieldByIdAndUserId("1", "u1");

      expect(result).toBeNull();
    });
  });

  // createField
  describe("createField", () => {
    it("should return created field", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: "1", name: "Field A" }],
      });

      const result = await createField(
        "u1",
        "Field A",
        [{ lat: 1, lng: 2 }],
        100,
        10,
        20,
      );

      expect(result).toEqual({ id: "1", name: "Field A" });
      expect(pool.query).toHaveBeenCalled();
    });

    //  coverage case
    it("should handle empty rows in createField", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await createField("u1", "Test", [], 10, 1, 2);

      expect(result).toBeUndefined();
    });
  });

  //  getFieldsByUserId
  describe("getFieldsByUserId", () => {
    it("should return list of fields", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: "1" }, { id: "2" }],
      });

      const result = await getFieldsByUserId("u1");

      expect(result).toEqual([{ id: "1" }, { id: "2" }]);
    });

    it("should return empty array when no fields", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await getFieldsByUserId("u1");

      expect(result).toEqual([]);
    });

    //  required for 100%
    it("should handle undefined rows", async () => {
      (pool.query as jest.Mock).mockResolvedValue({});

      const result = await getFieldsByUserId("u1");

      expect(result).toBeUndefined();
    });
  });

  //  deleteField
  describe("deleteField", () => {
    it("should return true when deleted", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });

      const result = await deleteField("1", "u1");

      expect(result).toBe(true);
    });

    it("should return false when rowCount = 0", async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });

      const result = await deleteField("1", "u1");

      expect(result).toBe(false);
    });

    // critical branch
    it("should return false when rowCount undefined", async () => {
      (pool.query as jest.Mock).mockResolvedValue({});

      const result = await deleteField("1", "u1");

      expect(result).toBe(false);
    });
  });

  //  updateFieldName (51–58)
  describe("updateFieldName", () => {
    it("should return updated field", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [{ id: "1", name: "New Name" }],
      });

      const result = await updateFieldName("1", "u1", "New Name");

      expect(result).toEqual({ id: "1", name: "New Name" });
    });

    //  missing branch
    it("should return undefined when no rows updated", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await updateFieldName("1", "u1", "New Name");

      expect(result).toBeUndefined();
    });
  });
});
