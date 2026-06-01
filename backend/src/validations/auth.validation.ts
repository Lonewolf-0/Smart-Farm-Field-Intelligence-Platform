import { RegisterRequest } from "../types";

export const validateRegisterInput = (data: RegisterRequest) => {
  const { name, email, password } = data;

  //Name validation
  if (!name || name.trim().length === 0) {
    return "Name is required";
  }

  if (name.trim().length < 3) {
    return "Name must be at least 3 characters";
  }

  //  Email validation (proper regex)
  if (!email || email.trim().length === 0) {
    return "Email is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  //  Password validation
  if (!password || password.trim().length === 0) {
    return "Password is required";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null; //valid
};
