import { Request, Response } from "express";
import { getWeatherData } from "../services/weather.service";
import { sendResponse } from "../utils/response";

export const getWeatherController = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    const data = await getWeatherData(Number(lat), Number(lng));
    return sendResponse(res, 200, "Weather Fetched", data);
  } catch (error: any) {
    return sendResponse(
      res,
      500,
      "Failed to fetch weather",
      null,
      error.message,
    );
  }
};
