import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/response";

export const validate =
  (validator: (data: any) => string | null) =>
  (req: Request, res: Response, next: NextFunction) => {
    const error = validator(req.body);

    if (error) {
      return sendResponse(res, 400, error);
    }

    next();
  };
