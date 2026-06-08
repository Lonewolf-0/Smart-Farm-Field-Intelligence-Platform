import {
  createUser,
  findUserByEmail,
  findUserWithPasswordByEmail,
} from "../../src/repositories/authRepository";
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

describe("Auth Repository - Login", () => {
  it("should return user with password", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          id: "1",
          email: "test@test.com",
          name: "Ashish",
          password: "hashed",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    const user = await findUserWithPasswordByEmail("test@test.com");

    expect(user?.email).toBe("test@test.com");
    expect(user?.password).toBe("hashed");
  });

  it("should return null if user not found", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [],
    });

    const user = await findUserWithPasswordByEmail("notfound@test.com");

    expect(user).toBeNull();
  });
});
