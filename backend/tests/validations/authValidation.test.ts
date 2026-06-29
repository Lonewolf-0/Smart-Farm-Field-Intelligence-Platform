import {
  validateRegisterInput,
  validateLoginInput,
} from "../../src/validations/authValidation";

describe("validateRegisterInput", () => {
  //  VALID CASE
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

  //  MALFORMED INPUTS (missing/undefined/wrong types)
  it("should fail if data is undefined or null", () => {
    expect(validateRegisterInput(undefined as any)).toBe("Invalid request data");
    expect(validateRegisterInput(null as any)).toBe("Invalid request data");
  });

  it("should fail if name is missing or not a string", () => {
    expect(validateRegisterInput({ email: "test@test.com", password: "123456" } as any)).toBe("Name is required");
    expect(validateRegisterInput({ name: 123, email: "test@test.com", password: "123456" } as any)).toBe("Name must be a valid string");
    expect(validateRegisterInput({ name: null, email: "test@test.com", password: "123456" } as any)).toBe("Name is required");
  });

  it("should fail if email is missing or not a string", () => {
    expect(validateRegisterInput({ name: "Ashish", password: "123456" } as any)).toBe("Email is required");
    expect(validateRegisterInput({ name: "Ashish", email: true, password: "123456" } as any)).toBe("Email must be a valid string");
    expect(validateRegisterInput({ name: "Ashish", email: null, password: "123456" } as any)).toBe("Email is required");
  });

  it("should fail if password is missing or not a string", () => {
    expect(validateRegisterInput({ name: "Ashish", email: "test@test.com" } as any)).toBe("Password is required");
    expect(validateRegisterInput({ name: "Ashish", email: "test@test.com", password: {} } as any)).toBe("Password must be a valid string");
    expect(validateRegisterInput({ name: "Ashish", email: "test@test.com", password: null } as any)).toBe("Password is required");
  });
});

describe("validateLoginInput", () => {
  //  VALID CASE
  it("should return null for valid input", () => {
    const result = validateLoginInput({
      email: "test@test.com",
      password: "123456",
    });

    expect(result).toBeNull();
  });

  //  EMAIL EMPTY
  it("should return error if email is empty", () => {
    const result = validateLoginInput({
      email: "",
      password: "123456",
    });

    expect(result).toBe("Email is required");
  });

  //  EMAIL ONLY SPACES
  it("should return error if email contains only spaces", () => {
    const result = validateLoginInput({
      email: "   ",
      password: "123456",
    });

    expect(result).toBe("Email is required");
  });

  //  EMAIL INVALID FORMAT
  it("should return error for invalid email format", () => {
    const result = validateLoginInput({
      email: "invalidemail",
      password: "123456",
    });

    expect(result).toBe("Invalid email format");
  });

  it("should return error for invalid email missing domain", () => {
    const result = validateLoginInput({
      email: "test@",
      password: "123456",
    });

    expect(result).toBe("Invalid email format");
  });

  //  PASSWORD EMPTY
  it("should return error if password is empty", () => {
    const result = validateLoginInput({
      email: "test@test.com",
      password: "",
    });

    expect(result).toBe("Password is required");
  });

  // PASSWORD ONLY SPACES
  it("should return error if password contains only spaces", () => {
    const result = validateLoginInput({
      email: "test@test.com",
      password: "   ",
    });

    expect(result).toBe("Password is required");
  });

  //  PASSWORD < 6
  it("should return error if password length is less than 6", () => {
    const result = validateLoginInput({
      email: "test@test.com",
      password: "123",
    });

    expect(result).toBe("Password must be at least 6 characters");
  });

  //  MALFORMED INPUTS (missing/undefined/wrong types)
  it("should fail if data is undefined or null", () => {
    expect(validateLoginInput(undefined as any)).toBe("Invalid request data");
    expect(validateLoginInput(null as any)).toBe("Invalid request data");
  });

  it("should return error if email is missing or not a string", () => {
    expect(validateLoginInput({ password: "123456" } as any)).toBe("Email is required");
    expect(validateLoginInput({ email: 123, password: "123456" } as any)).toBe("Email must be a valid string");
    expect(validateLoginInput({ email: null, password: "123456" } as any)).toBe("Email is required");
  });

  it("should return error if password is missing or not a string", () => {
    expect(validateLoginInput({ email: "test@test.com" } as any)).toBe("Password is required");
    expect(validateLoginInput({ email: "test@test.com", password: [] } as any)).toBe("Password must be a valid string");
    expect(validateLoginInput({ email: "test@test.com", password: null } as any)).toBe("Password is required");
  });
});
