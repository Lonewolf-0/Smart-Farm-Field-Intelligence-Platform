import axios, { AxiosResponse } from "axios";
import https from "https";
import { ENV } from "../config/env";
import { WeatherData } from "../types";
import logger from "../utils/logger";

const API_KEY = ENV.OPENWEATHER_API_KEY;
const BASE_URL = ENV.OPENWEATHER_BASE_URL;

const defaultAgent = new https.Agent({
  rejectUnauthorized: false,
});

const ipv4Agent = new https.Agent({
  family: 4,
  rejectUnauthorized: false,
});

let preferIPv4 = false;

/**
 * Helper function to fetch data from a URL with retry logic.
 * 
 * @param {string} url - The URL to fetch.
 * @param {number} [retries=1] - The number of times to retry the request upon failure.
 * @returns {Promise<AxiosResponse<any>>} The axios response.
 * @throws {Error} If the request fails after all retries.
 */
const fetchWithRetry = async (
  url: string,
  retries = 1,
): Promise<AxiosResponse<any>> => {
  const agentToUse = preferIPv4 ? ipv4Agent : defaultAgent;
  const timeoutToUse = preferIPv4 ? 10000 : 4000;

  try {
    return await axios.get(url, { httpsAgent: agentToUse, timeout: timeoutToUse });
  } catch (error: any) {
    if (!preferIPv4) {
      logger.warn(`OpenWeather connection failed/timed out. Falling back to IPv4 for URL: ${url}`);
      preferIPv4 = true;
      return fetchWithRetry(url, retries);
    }

    if (retries > 0) {
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
};

/**
 * Fetches current weather and a 7-day forecast for a given location using the OpenWeather API.
 * 
 * @param {number} lat - The latitude coordinate.
 * @param {number} lng - The longitude coordinate.
 * @returns {Promise<WeatherData>} An object containing current weather metrics and the 7-day forecast.
 * @throws {Error} If the API request fails.
 */
export const getWeatherData = async (
  lat: number,
  lng: number,
): Promise<WeatherData> => {
  try {
    //current weather
    const currentUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=imperial`;

    //7-days forecast
    const forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&exclude=minutely,hourly,alerts&appid=${API_KEY}&units=imperial`;
    const [currentRes, forecastRes] = await Promise.all([
      fetchWithRetry(currentUrl),
      fetchWithRetry(forecastUrl),
    ]);

    const current = currentRes.data;
    const forecast = forecastRes.data;

    // Map forecast data: OpenWeather returns data in 3-hour intervals.
    // We filter every 8th item to extract a daily forecast (24h / 3h = 8 intervals per day).
    const forecastData = forecast.list
      .filter((_: any, index: number) => index % 8 === 0)
      .slice(0, 7)
      .map((item: any) => ({
        date: item.dt_txt,
        tempMax: item.main.temp_max,
        tempMin: item.main.temp_min,
        precipitation: item.rain?.["3h"] || 0,
        condition: item.weather[0]?.main || "Unknown",
      }));

    //final response
    const weatherData: WeatherData = {
      temperature: current.main.temp,
      humidity: current.main.humidity,
      windSpeed: current.wind.speed,
      rainfall: current.rain?.["1h"] || 0, // OpenWeather may return mm or inches, typically mm, but let's just pass it
      pressure: current.main.pressure ? current.main.pressure * 0.02953 : undefined, // hPa to inHg
      forecast: forecastData,
    };
    return weatherData;
  } catch (error: any) {
    logger.error(`Weather API Error : ${error.message}`);
    throw new Error("WEATHER_API_ERROR");
  }
};
