import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import SoilCard from "../../../src/components/Dashboard/SoilCard";

// Mock Recharts chart component to prevent JSDOM layout issues
vi.mock("../../../src/components/Dashboard/SoilHistoryChart", () => ({
  default: () => <div data-testid="soil-history-chart-mock">Soil History Chart Mock</div>,
}));

// Mock the analysis context hook
const mockUseAnalysisContext = vi.fn();
vi.mock("../../../src/context/AnalysisContext", () => ({
  useAnalysisContext: () => mockUseAnalysisContext(),
}));

describe("SoilCard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading animation when context is loading and no data is present", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { container } = render(<SoilCard fieldId="field1" />);

    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("should render error message when context loading is false and no records present", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<SoilCard fieldId="field1" />);

    expect(screen.getByText("Failed to load soil data.")).toBeInTheDocument();
  });

  it("should render acidic pH and poor organic carbon metrics correctly", () => {
    const mockSoil = {
      records: [
        {
          id: 1,
          year: 2025,
          season: "Kharif",
          created_at: "2026-06-10T00:00:00Z",
          data: {
            layers: [
              {
                depthLabel: "0-5cm",
                ph: 5.2, // Acidic (< 6.0), ph < 5.5 is red-400
                organicCarbon: 4, // 0.4% (< 0.5% is Poor, red-400)
                clay: 20,
                sand: 60,
                nitrogen: 15,
                texture: "Clay", // clay subtracts 15
              },
            ],
          },
        },
      ],
      alerts: [],
    };

    mockUseAnalysisContext.mockReturnValue({
      data: { soil: mockSoil },
      isLoading: false,
    });

    render(<SoilCard fieldId="field1" />);

    // Check pH values and color codes
    const phStatusElement = screen.getByText("Acidic");
    expect(phStatusElement).toBeInTheDocument();
    const phValueElement = screen.getByText("5.2");
    expect(phValueElement).toHaveClass("text-red-400");

    // Check Organic Carbon rating and values
    const ocStatusElement = screen.getByText("Poor");
    expect(ocStatusElement).toBeInTheDocument();
    const ocValueElement = screen.getByText("0.40%");
    expect(ocValueElement).toHaveClass("text-red-400");

    // Health Score calculation test:
    // Base: 100
    // ph 5.2 < 5.5 => -25
    // oc 0.4 < 0.5 => -25
    // texture Clay => -15
    // Expected = 100 - 25 - 25 - 15 = 35 (Critical, text-red-400)
    const scoreElement = screen.getByText("35");
    expect(scoreElement).toBeInTheDocument();
    expect(scoreElement).toHaveClass("text-red-400");
  });

  it("should render neutral pH, high organic carbon and green health score correctly", () => {
    const mockSoil = {
      records: [
        {
          id: 1,
          year: 2025,
          season: "Kharif",
          created_at: "2026-06-10T00:00:00Z",
          data: {
            layers: [
              {
                depthLabel: "0-5cm",
                ph: 6.8, // Neutral (6.0 - 7.5, green-400)
                organicCarbon: 18, // 1.8% (> 1.5% is High, green-400)
                clay: 10,
                sand: 40,
                nitrogen: 35,
                texture: "Loam", // no penalty
              },
            ],
          },
        },
      ],
      alerts: [],
    };

    mockUseAnalysisContext.mockReturnValue({
      data: { soil: mockSoil },
      isLoading: false,
    });

    render(<SoilCard fieldId="field1" />);

    // Check pH values and color codes
    const phStatusElement = screen.getByText("Neutral");
    expect(phStatusElement).toBeInTheDocument();
    const phValueElement = screen.getByText("6.8");
    expect(phValueElement).toHaveClass("text-green-400");

    // Check Organic Carbon rating and values
    const ocStatusElement = screen.getByText("High");
    expect(ocStatusElement).toBeInTheDocument();
    const ocValueElement = screen.getByText("1.80%");
    expect(ocValueElement).toHaveClass("text-green-400");

    // Health Score calculation test:
    // Base: 100
    // ph 6.8 (neutral) => -0
    // oc 1.8 (>1.5) => -0
    // texture Loam => -0
    // Expected = 100 (Optimal, text-green-400)
    const scoreElement = screen.getByText("100");
    expect(scoreElement).toBeInTheDocument();
    expect(scoreElement).toHaveClass("text-green-400");
  });
});
