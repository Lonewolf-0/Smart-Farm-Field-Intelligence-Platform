import { findLatestSoilByFieldId } from "../../src/repositories/soilRepository";
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
});
``;
