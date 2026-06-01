import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { RegisterRequest, LoginRequest } from "../types";
import {
  findUserByEmail,
  createUser,
  findUserWithPasswordByEmail,
} from "../repositories/auth.repository";

export const registerUser = async (payload: RegisterRequest) => {
  const { name, email, password } = payload;

  // duplicate email
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // create user
  const user = await createUser(name, email, hashedPassword);

  // generate token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return { user, token };
};

export const loginUser = async (payload: LoginRequest) => {
  const { email, password } = payload;

  //find user
  const user = await findUserWithPasswordByEmail(email);

  //generic error
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  //compare password
  const isMatch = await bcrypt.compare(password, user.password);

  //generic error
  if (!isMatch) {
    throw new Error("INVALID_PASSWORD");
  }

  //generate token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: "7d" },
  );

  //remove password
  const { password: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
};
