import { Response } from "express";

const sendResponse = <T = any>(
  res: Response,
  statusCode = 200,
  message = "Success",
  data: T | null = null,
  error: string | null = null,
) => {
  const response: {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
  } = {
    success: statusCode < 400,
    message,
  };

  if (data) response.data = data;
  if (error) response.error = error;

  return res.status(statusCode).json(response);
};

export { sendResponse };
