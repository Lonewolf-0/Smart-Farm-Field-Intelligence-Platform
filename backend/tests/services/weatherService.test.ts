import axios from "axios";
import { getWeatherData } from "../../src/services/weatherService";

jest.mock("axios");

describe("Weather Service", () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  const mockCurrent = {
    data: {
      main: { temp: 30, humidity: 70 },
      wind: { speed: 5 },
      rain: { "1h": 2 },
    },
  };

  const mockForecast = {
    data: {
      list: Array.from({ length: 56 }).map((_, i) => ({
        dt_txt: `2026-06-${i + 1}`,
        main: {
          temp_max: 32,
          temp_min: 25,
        },
        rain: { "3h": 1 },
        weather: [{ main: "Clouds" }],
      })),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SUCCESS
  it("should return weather data correctly", async () => {
    mockedAxios.get
      .mockResolvedValueOnce(mockCurrent as any)
      .mockResolvedValueOnce(mockForecast as any);

    const result = await getWeatherData(18, 73);

    expect(result.temperature).toBe(30);
    expect(result.humidity).toBe(70);
    expect(result.windSpeed).toBe(5);
    expect(result.rainfall).toBe(2);
    expect(result.forecast.length).toBe(7);
  });

  // NO CURRENT RAIN
  it("should fallback rainfall to 0 if not present", async () => {
    const currentNoRain = {
      data: {
        main: { temp: 30, humidity: 70 },
        wind: { speed: 5 },
      },
    };

    mockedAxios.get
      .mockResolvedValueOnce(currentNoRain as any)
      .mockResolvedValueOnce(mockForecast as any);

    const result = await getWeatherData(18, 73);

    expect(result.rainfall).toBe(0);
  });

  // RETRY SUCCESS
  it("should retry once and succeed", async () => {
    let callCount = 0;

    mockedAxios.get.mockImplementation(() => {
      callCount++;

      if (callCount === 1) {
        return Promise.reject(new Error("FAIL")); // fail
      }

      if (callCount === 2) {
        return Promise.resolve(mockCurrent as any); // retry success
      }

      return Promise.resolve(mockForecast as any); // forecast
    });

    const result = await getWeatherData(18, 73);

    expect(result.temperature).toBe(30);
    expect(callCount).toBe(3);
  });

  // RETRY FAIL
  it("should throw error if retry also fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("FAIL"));

    await expect(getWeatherData(18, 73)).rejects.toThrow("WEATHER_API_ERROR");
  });

  // FORECAST EMPTY STRUCTURE
  it("should handle empty forecast safely", async () => {
    const badForecast = {
      data: {
        list: Array.from({ length: 56 }).map(() => ({
          dt_txt: "2026-06-01",
          main: {},
          weather: [],
        })),
      },
    };

    mockedAxios.get
      .mockResolvedValueOnce(mockCurrent as any)
      .mockResolvedValueOnce(badForecast as any);

    const result = await getWeatherData(18, 73);

    expect(result.forecast.length).toBe(7);
  });

  // FORECAST NO RAIN
  it("should fallback precipitation to 0", async () => {
    const noRainForecast = {
      data: {
        list: Array.from({ length: 56 }).map(() => ({
          dt_txt: "2026-06-01",
          main: {
            temp_max: 30,
            temp_min: 20,
          },
          weather: [{ main: "Clear" }],
        })),
      },
    };

    mockedAxios.get
      .mockResolvedValueOnce(mockCurrent as any)
      .mockResolvedValueOnce(noRainForecast as any);

    const result = await getWeatherData(18, 73);

    expect(result.forecast[0].precipitation).toBe(0);
  });
});
