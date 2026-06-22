import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import WeatherCard from "../../../src/components/Dashboard/WeatherCard";

// Mock the Recharts chart inside WeatherChart to avoid SVG layout errors in JSDOM
vi.mock("../../../src/components/Dashboard/WeatherChart", () => ({
  default: () => <div data-testid="weather-chart-mock">Weather Chart Mock</div>,
}));

// Mock the analysis context hook
const mockUseAnalysisContext = vi.fn();
vi.mock("../../../src/context/AnalysisContext", () => ({
  useAnalysisContext: () => mockUseAnalysisContext(),
}));

describe("WeatherCard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading animation when context is loading and no data is present", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { container } = render(<WeatherCard fieldId="field1" />);

    expect(container.firstChild).toHaveClass("animate-pulse");
    expect(screen.queryByText("Weather Forecast")).not.toBeInTheDocument();
  });

  it("should render error card when weather data is missing and loading is false", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<WeatherCard fieldId="field1" />);

    expect(screen.getByText("Weather Data Unavailable")).toBeInTheDocument();
  });

  it("should render weather metrics correctly when data is available", () => {
    const mockWeather = {
      temperature: 28.4,
      humidity: 62,
      windSpeed: 4.5, // 4.5 m/s * 2.23694 = 10.1 mph
      rainfall: 0,
      forecast: [
        { date: "2026-06-10", tempMin: 22, tempMax: 30, temperature: 28.4, precipitation: 0, condition: "Clear" },
        { date: "2026-06-11", tempMin: 23, tempMax: 31, temperature: 29.0, precipitation: 2.0, condition: "Clouds" },
      ],
    };

    mockUseAnalysisContext.mockReturnValue({
      data: { weather: mockWeather },
      isLoading: false,
    });

    render(<WeatherCard fieldId="field1" />);

    expect(screen.getByText("Weather Forecast")).toBeInTheDocument();

    // Check formatted values
    const expectedTempF = Math.round((mockWeather.temperature * 9/5) + 32); // 83
    expect(screen.getAllByText(`${expectedTempF}°F`)).toHaveLength(2); // Current header + Stats grid
    expect(screen.getAllByText("Clear sky")[0]).toBeInTheDocument();
    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("10.1 mph")).toBeInTheDocument();
  });

  it("should display a warning banner when heavy rainfall is expected in the forecast", () => {
    const heavyRainWeather = {
      temperature: 25.0,
      humidity: 90,
      windSpeed: 6.0,
      rainfall: 15.0,
      forecast: [
        { date: "2026-06-10", tempMin: 21, tempMax: 27, temperature: 25, precipitation: 20, condition: "Rain" },
        { date: "2026-06-11", tempMin: 20, tempMax: 26, temperature: 24, precipitation: 45, condition: "Rain" }, // total = 65mm
      ],
    };

    mockUseAnalysisContext.mockReturnValue({
      data: { weather: heavyRainWeather },
      isLoading: false,
    });

    render(<WeatherCard fieldId="field1" />);

    expect(screen.getByText("Heavy rainfall alert: 65.0mm expected")).toBeInTheDocument();
  });

  it("should allow dismissing the alert banner", () => {
    const moderateRainWeather = {
      temperature: 26.0,
      humidity: 85,
      windSpeed: 3.0,
      rainfall: 5.0,
      forecast: [
        { date: "2026-06-10", tempMin: 22, tempMax: 28, temperature: 26, precipitation: 10, condition: "Rain" },
        { date: "2026-06-11", tempMin: 21, tempMax: 27, temperature: 25, precipitation: 25, condition: "Rain" }, // total = 35mm
      ],
    };

    mockUseAnalysisContext.mockReturnValue({
      data: { weather: moderateRainWeather },
      isLoading: false,
    });

    render(<WeatherCard fieldId="field1" />);

    const alertMessage = screen.getByText("Moderate rainfall expected: 35.0mm");
    expect(alertMessage).toBeInTheDocument();

    const dismissBtn = screen.getByRole("button", { name: /dismiss/i || /close/i || /x/i || "" });
    fireEvent.click(dismissBtn);

    expect(alertMessage).not.toBeInTheDocument();
  });
});
