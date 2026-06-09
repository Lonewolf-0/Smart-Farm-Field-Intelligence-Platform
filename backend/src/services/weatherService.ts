import axios, { AxiosResponse } from "axios";
import { ENV } from "../config/env";
import { WeatherData } from "../types";

const API_KEY = ENV.OPENWEATHER_API_KEY;
const BASE_URL = ENV.OPENWEATHER_BASE_URL;

//helper : retry logic
const fetchWithRetry = async (
  url: string,
  retries = 1,
): Promise<AxiosResponse<any>> => {
  try {
    return await axios.get(url);
  } catch (error) {
    if (retries > 0) {
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
};

export const getWeatherData = async (
  lat: number,
  lng: number,
): Promise<WeatherData> => {
  try {
    //current weather
    const currentUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`;

    //7-days forecast
    const forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lng}&exclude=minutely,hourly,alerts&appid=${API_KEY}&units=metric`;
    const [currentRes, forecastRes] = await Promise.all([
      fetchWithRetry(currentUrl),
      fetchWithRetry(forecastUrl),
    ]);

    const current = currentRes.data;
    const forecast = forecastRes.data;

    //map forecast
    const forecastData = forecast.list
      .filter((_: any, index: number) => index % 8 === 0) // every 24h (3h interval → 8)
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
      rainfall: current.rain?.["1h"] || 0,
      forecast: forecastData,
    };
    return weatherData;
  } catch (error: any) {
    console.log("Weather API Error : ", error.message);
    throw new Error("WEATHER_API_ERROR");
  }
};
