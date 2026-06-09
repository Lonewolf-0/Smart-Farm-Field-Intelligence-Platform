import { Response } from "express";

/**
 * Standardized utility function to send API responses.
 * Ensures that all API endpoints return a consistent JSON structure.
 * 
 * @template T - The type of the data payload.
 * @param {Response} res - The Express response object.
 * @param {number} [statusCode=200] - The HTTP status code (defaults to 200).
 * @param {string} [message="Success"] - A human-readable message summarizing the outcome.
 * @param {T | null} [data=null] - The actual data payload to return.
 * @param {string | null} [error=null] - A descriptive error message if the request failed.
 * @returns {Response} The Express response object with the sent JSON payload.
 */
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
