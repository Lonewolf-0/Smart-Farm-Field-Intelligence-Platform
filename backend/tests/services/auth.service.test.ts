import { registerUser, loginUser } from "../../src/services/auth.service";
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

describe("Auth Service - Login", () => {
  const mockUser = {
    id: "1",
    email: "test@test.com",
    name: "Ashish",
    password: "hashedPassword",
    createdAt: new Date().toISOString(),
  };

  //  SUCCESS LOGIN
  it("should login user successfully", async () => {
    (repo.findUserWithPasswordByEmail as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue("token");

    const result = await loginUser({
      email: "test@test.com",
      password: "123456",
    });

    expect(result.token).toBe("token");
    expect(result.user.email).toBe("test@test.com");
  });

  // USER NOT FOUND
  it("should throw error if user not found", async () => {
    (repo.findUserWithPasswordByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      loginUser({ email: "test@test.com", password: "123456" }),
    ).rejects.toThrow("INVALID_CREDENTIALS");
  });

  // WRONG PASSWORD
  it("should throw error if password is incorrect", async () => {
    (repo.findUserWithPasswordByEmail as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      loginUser({ email: "test@test.com", password: "wrong" }),
    ).rejects.toThrow("INVALID_PASSWORD");
  });
});
