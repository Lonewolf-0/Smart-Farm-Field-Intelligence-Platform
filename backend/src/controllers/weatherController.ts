import { Request, Response } from "express";
import { getWeatherData } from "../services/weatherService";
import { sendResponse } from "../utils/response";
import { findFieldByIdService } from "../services/fieldService";
import { AuthRequest } from "../types";
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

export const getFieldWeather = async (req: AuthRequest, res: Response) => {
  try {
    const { fieldId } = req.params;
    const userId = req.user?.id;
    const field = await findFieldByIdService(fieldId);

    if (!field) {
      return sendResponse(res, 404, "Field not found");
    }

    //ownership check
    if (field.user_id !== userId) {
      return sendResponse(res, 403, "Forbidden", null, "FIELD_ACCESS_DENIED");
    }

    //extract centroid
    const lat = field.centroid_lat;
    const lng = field.centroid_lng;

    //get weather
    const weather = await getWeatherData(lat, lng);
    return sendResponse(res, 200, "Weather fetched", weather);
  } catch (error: any) {
    console.error("Get field weather error : ", error);
    return sendResponse(
      res,
      500,
      "Failed to fetch weather",
      null,
      error.message,
    );
  }
};
