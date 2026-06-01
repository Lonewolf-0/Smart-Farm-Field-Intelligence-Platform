import {
  createUser,
  findUserByEmail,
} from "../../src/repositories/auth.repository";
import { pool } from "../../src/config/db";

jest.mock("../../src/config/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("Auth Repository", () => {
  it("should create user", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ id: "1", name: "Ashish", email: "test@test.com" }],
    });

    const result = await createUser("Ashish", "test@test.com", "hashed");

    expect(result.email).toBe("test@test.com");
  });

  it("should find user by email", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ id: "1", email: "test@test.com" }],
    });

    const user = await findUserByEmail("test@test.com");

    expect(user?.email).toBe("test@test.com");
  });
});
