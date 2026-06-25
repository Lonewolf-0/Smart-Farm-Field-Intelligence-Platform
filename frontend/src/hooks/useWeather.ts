import { useState, useEffect } from "react";
import api from "../services/api";

export interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  condition: string;
}

export interface WeatherState {
  loading: boolean;
  error?: string;
  locationName?: string;
  temp?: number;
  condition?: string;
  humidity?: number;
  wind?: number;
  pressure?: number;
  forecast?: ForecastDay[];
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherState>({ loading: true });

  useEffect(() => {
    const loadFallbackWeather = () => {
      setWeather({
        loading: false,
        locationName: "Chicago, IL",
        temp: 72,
        condition: "Clear",
        humidity: 49,
        wind: 12,
        pressure: 30.21,
        forecast: [
          { date: "2026-06-25", tempMax: 77, tempMin: 60, precipitation: 0, condition: "Clear" },
          { date: "2026-06-26", tempMax: 79, tempMin: 62, precipitation: 0, condition: "Clouds" },
          { date: "2026-06-27", tempMax: 75, tempMin: 58, precipitation: 0.2, condition: "Rain" },
          { date: "2026-06-28", tempMax: 82, tempMin: 65, precipitation: 0, condition: "Clear" },
          { date: "2026-06-29", tempMax: 85, tempMin: 68, precipitation: 0, condition: "Clear" },
        ]
      });
    };

    if (!navigator.geolocation) {
      loadFallbackWeather();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.get(`/weather?lat=${latitude}&lng=${longitude}`);
          const data = res.data.data; // response is wrapped in { status, message, data }

          if (data) {
            setWeather({
              loading: false,
              locationName: "Chicago, IL", 
              temp: Math.round(data.temperature),
              condition: data.forecast?.[0]?.condition || "Clear",
              humidity: data.humidity,
              wind: Math.round(data.windSpeed),
              pressure: data.pressure,
              forecast: data.forecast,
            });
          } else {
             loadFallbackWeather();
          }
        } catch (error) {
          console.warn("API failed, using fallback mock data:", error);
          loadFallbackWeather();
        }
      },
      (error) => {
        console.warn("Geolocation failed or timed out, using fallback:", error.message);
        loadFallbackWeather();
      },
      { timeout: 3000, maximumAge: 60000 }
    );
  }, []);

  return weather;
}
