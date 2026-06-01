import { validateRegisterInput } from "../../src/validations/auth.validation";

describe("validateRegisterInput", () => {
  // ✅ VALID CASE
  it("should return null for valid input", () => {
    const result = validateRegisterInput({
      name: "Ashish",
      email: "test@test.com",
      password: "123456",
    });

    expect(result).toBeNull();
  });

  //  NAME EMPTY
  it("should fail if name is empty", () => {
    const result = validateRegisterInput({
      name: "",
      email: "test@test.com",
      password: "123456",
    });

    expect(result).toBe("Name is required");
  });

  // NAME ONLY SPACES
  it("should fail if name has only spaces", () => {
    const result = validateRegisterInput({
      name: "   ",
      email: "test@test.com",
      password: "123456",
    });

    expect(result).toBe("Name is required");
  });

  //  NAME TOO SHORT
  it("should fail if name length is less than 3", () => {
    const result = validateRegisterInput({
      name: "Aa",
      email: "test@test.com",
      password: "123456",
    });

    expect(result).toBe("Name must be at least 3 characters");
  });

  //  EMAIL EMPTY
  it("should fail if email is empty", () => {
    const result = validateRegisterInput({
      name: "Ashish",
      email: "",
      password: "123456",
    });

    expect(result).toBe("Email is required");
  });

  //  EMAIL ONLY SPACES
  it("should fail if email is only spaces", () => {
    const result = validateRegisterInput({
      name: "Ashish",
      email: "   ",
      password: "123456",
    });

    expect(result).toBe("Email is required");
  });

  //  EMAIL INVALID FORMAT
  it("should fail for invalid email (missing @)", () => {
    const result = validateRegisterInput({
      name: "Ashish",
      email: "invalidemail",
      password: "123456",
    });

    expect(result).toBe("Invalid email format");
  });

  it("should fail for invalid email (missing domain)", () => {
    const result = validateRegisterInput({
      name: "Ashish",
      email: "test@",
      password: "123456",
    });

    expect(result).toBe("Invalid email format");
  });

  //  PASSWORD EMPTY
  it("should fail if password is empty", () => {
    const result = validateRegisterInput({
      name: "Ashish",
      email: "test@test.com",
      password: "",
    });

    expect(result).toBe("Password is required");
  });

  //  PASSWORD ONLY SPACES
  it("should fail if password is only spaces", () => {
    const result = validateRegisterInput({
      name: "Ashish",
      email: "test@test.com",
      password: "   ",
    });

    expect(result).toBe("Password is required");
  });

  //  PASSWORD TOO SHORT
  it("should fail if password is less than 6 characters", () => {
    const result = validateRegisterInput({
      name: "Ashish",
      email: "test@test.com",
      password: "123",
    });

    expect(result).toBe("Password must be at least 6 characters");
  });
});
