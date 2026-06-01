import { registerUser } from "../../src/services/auth.service";
import * as repo from "../../src/repositories/auth.repository";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

jest.mock("../../src/repositories/auth.repository");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Service", () => {
  it("should register user successfully", async () => {
    (repo.findUserByEmail as jest.Mock).mockResolvedValue(null);
    (repo.createUser as jest.Mock).mockResolvedValue({
      id: "1",
      email: "test@test.com",
      name: "Ashish",
    });

    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed");
    (jwt.sign as jest.Mock).mockReturnValue("token");

    const result = await registerUser({
      name: "Ashish",
      email: "test@test.com",
      password: "123456",
    });

    expect(result.token).toBe("token");
  });

  it("should throw error if email exists", async () => {
    (repo.findUserByEmail as jest.Mock).mockResolvedValue({
      id: "1",
    });

    await expect(
      registerUser({
        name: "Ashish",
        email: "test@test.com",
        password: "123456",
      }),
    ).rejects.toThrow("EMAIL_ALREADY_EXISTS");
  });
});
