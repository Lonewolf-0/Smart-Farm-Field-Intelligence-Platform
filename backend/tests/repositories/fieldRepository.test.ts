import { findFieldById } from "../../src/repositories/fieldRepository";
import { pool } from "../../src/config/db";

jest.mock("../../src/config/db", () => ({
  pool: { query: jest.fn() },
}));

describe("Field Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // FOUND
  it("should return field when found", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ id: "1", user_id: "u1" }],
    });

    const result = await findFieldById("1");

    expect(result).toEqual({ id: "1", user_id: "u1" });
    expect(pool.query).toHaveBeenCalled();
  });

  // NOT FOUND
  it("should return null when field not found", async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

    const result = await findFieldById("1");

    expect(result).toBeNull();
  });
});
