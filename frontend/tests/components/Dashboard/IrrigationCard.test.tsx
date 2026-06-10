import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import IrrigationCard from "../../../src/components/Dashboard/IrrigationCard";

// Mock the analysis context hook
const mockUseAnalysisContext = vi.fn();
vi.mock("../../../src/context/AnalysisContext", () => ({
  useAnalysisContext: () => mockUseAnalysisContext(),
}));

describe("IrrigationCard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading skeleton when context is loading and no data is present", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { container } = render(<IrrigationCard fieldId="field1" />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("should render error fallback when irrigation data is missing", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<IrrigationCard fieldId="field1" />);
    expect(screen.getByText("Failed to load irrigation data.")).toBeInTheDocument();
  });

  it("should render Critical urgency for nextIrrigationDays = 0", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: {
        irrigation: {
          nextIrrigationDays: 0,
          waterRequired: 15.5,
          currentSoilMoisture: 42,
          dailyET: 4.2,
          rainfallNext7Days: 2.5,
        },
      },
      isLoading: false,
    });

    render(<IrrigationCard fieldId="field1" />);

    expect(screen.getByText("Irrigation Plan")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("TODAY")).toBeInTheDocument();
    // 15.5 * 10000 = 155,000
    expect(screen.getByText(/Needs 15.5 mm/)).toBeInTheDocument();
    expect(screen.getByText(/155,000 L\/ha/)).toBeInTheDocument();
    expect(screen.getByText("4.2")).toBeInTheDocument();
    expect(screen.getByText("2.5")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("should render Approaching urgency for nextIrrigationDays = 3", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: {
        irrigation: {
          nextIrrigationDays: 3,
          waterRequired: 8.0,
          currentSoilMoisture: 58,
          dailyET: 3.5,
          rainfallNext7Days: 12.0,
        },
      },
      isLoading: false,
    });

    render(<IrrigationCard fieldId="field1" />);

    expect(screen.getByText("Approaching")).toBeInTheDocument();
    expect(screen.getByText("3 Days")).toBeInTheDocument();
    expect(screen.getByText(/Needs 8 mm/)).toBeInTheDocument();
    expect(screen.getByText(/80,000 L\/ha/)).toBeInTheDocument();
  });

  it("should render Optimal urgency and show 'No watering required' when waterRequired is 0", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: {
        irrigation: {
          nextIrrigationDays: 7,
          waterRequired: 0,
          currentSoilMoisture: 82,
          dailyET: 2.8,
          rainfallNext7Days: 25.0,
        },
      },
      isLoading: false,
    });

    render(<IrrigationCard fieldId="field1" />);

    expect(screen.getByText("Optimal")).toBeInTheDocument();
    expect(screen.getByText("7 Days")).toBeInTheDocument();
    expect(screen.getByText("No watering required")).toBeInTheDocument();
  });
});
