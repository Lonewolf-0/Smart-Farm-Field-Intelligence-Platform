import {
  findLatestSoilByFieldId,
  findLatestSoilByCreatedAt,
  getHistoryByFieldId,
  insertSoilData
} from "../../src/repositories/soilRepository";
import { pool } from "../../src/config/db";

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

describe("Soil Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //  when soil data exists
  it("should return latest soil data when found", async () => {
    const mockSoil = {
      id: "1",
      field_id: "f1",
      year: 2025,
      nitrogen: 10,
    };

    (pool.query as jest.Mock).mockResolvedValue({
      rows: [mockSoil],
    });

    const result = await findLatestSoilByFieldId("f1");

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM soil_data"),
      ["f1"],
    );
    expect(result).toEqual(mockSoil);
  });

  //  when no soil data
  it("should return null when no soil data found", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [],
    });

    const result = await findLatestSoilByFieldId("f1");

    expect(result).toBeNull();
  });

  // edge case for 100% coverage
  it("should return null when rows is undefined", async () => {
    (pool.query as jest.Mock).mockResolvedValue({});

    const result = await findLatestSoilByFieldId("f1");

    expect(result).toBeNull();
  });

  describe("findLatestSoilByCreatedAt", () => {
    it("should return latest soil data when found", async () => {
      const mockSoilData = { t10: 280, moisture: 0.5 };
      const mockRow = { data: mockSoilData };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockRow],
      });

      const result = await findLatestSoilByCreatedAt("f1");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT data FROM soil_data"),
        ["f1"]
      );
      expect(result).toEqual(mockRow);
    });

    it("should return null when no soil data found", async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await findLatestSoilByCreatedAt("f1");

      expect(result).toBeNull();
    });

    it("should return null when rows is undefined", async () => {
      (pool.query as jest.Mock).mockResolvedValue({});

      const result = await findLatestSoilByCreatedAt("f1");

      expect(result).toBeNull();
    });
  });

  describe("getHistoryByFieldId", () => {
    it("should return soil data history", async () => {
      const mockHistory = {
        rows: [
          { id: "1", year: 2025, season: "Spring", data: {}, created_at: "2025-01-01" },
          { id: "2", year: 2024, season: "Fall", data: {}, created_at: "2024-09-01" },
        ],
      };

      (pool.query as jest.Mock).mockResolvedValue(mockHistory);

      const result = await getHistoryByFieldId("f1");

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, year, season, data, created_at FROM soil_data"),
        ["f1"]
      );
      expect(result).toEqual(mockHistory);
    });
  });

  describe("insertSoilData", () => {
    it("should insert soil data and return the inserted row", async () => {
      const mockInsertedRow = {
        id: "1",
        field_id: "f1",
        year: 2025,
        season: "Spring",
        data: { t10: 280 },
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockInsertedRow],
      });

      const result = await insertSoilData("f1", 2025, "Spring", { t10: 280 });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO soil_data"),
        ["f1", 2025, "Spring", JSON.stringify({ t10: 280 })]
      );
      expect(result).toEqual(mockInsertedRow);
    });
  });
});
