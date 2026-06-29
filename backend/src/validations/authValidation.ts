import { RegisterRequest, LoginRequest } from "../types";

export const validateRegisterInput = (data: RegisterRequest) => {
  if (!data) {
    return "Invalid request data";
  }

  const { name, email, password } = data;

  //Name validation
  if (name === undefined || name === null || name === "") {
    return "Name is required";
  }

  if (typeof name !== "string") {
    return "Name must be a valid string";
  }

  if (name.trim().length === 0) {
    return "Name is required";
  }

  if (name.trim().length < 3) {
    return "Name must be at least 3 characters";
  }

  //  Email validation (proper regex)
  if (email === undefined || email === null || email === "") {
    return "Email is required";
  }

  if (typeof email !== "string") {
    return "Email must be a valid string";
  }

  if (email.trim().length === 0) {
    return "Email is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  //  Password validation
  if (password === undefined || password === null || password === "") {
    return "Password is required";
  }

  if (typeof password !== "string") {
    return "Password must be a valid string";
  }

  if (password.trim().length === 0) {
    return "Password is required";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null; //valid
};

export const validateLoginInput = (data: LoginRequest): string | null => {
  if (!data) {
    return "Invalid request data";
  }

  const { email, password } = data;

  if (email === undefined || email === null || email === "") {
    return "Email is required";
  }

  if (typeof email !== "string") {
    return "Email must be a valid string";
  }

  if (email.trim().length === 0) {
    return "Email is required";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  if (password === undefined || password === null || password === "") {
    return "Password is required";
  }

  if (typeof password !== "string") {
    return "Password must be a valid string";
  }

  if (password.trim().length === 0) {
    return "Password is required";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
};
