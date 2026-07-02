import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { pool } from "../config/db";
import { sendResponse } from "../utils/response";
import { AuthRequest, JwtPayload } from "../types";

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Extract token
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query && typeof req.query.token === "string") {
      token = req.query.token;
    }

    if (!token) {
      return sendResponse(res, 401, "Unauthorized", null, "NO_TOKEN");
    }

    // 2. Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;

    // 3. Fetch user from DB
    const result = await pool.query(
      `SELECT id, email, name, created_at as "createdAt"
       FROM users WHERE id = $1`,
      [decoded.userId],
    );

    const user = result.rows[0];

    if (!user) {
      return sendResponse(res, 401, "Unauthorized", null, "USER_NOT_FOUND");
    }

    // 4. Attach user
    req.user = user;

    // 5. Continue
    next();
  } catch (error: any) {
    console.error("Auth Error:", error);
    return sendResponse(res, 401, "Unauthorized", null, "INVALID_TOKEN");
  }
};
