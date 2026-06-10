import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import CropSuitabilityCard from "../../../src/components/Dashboard/CropSuitabilityCard";

// Mock the analysis context hook
const mockUseAnalysisContext = vi.fn();
vi.mock("../../../src/context/AnalysisContext", () => ({
  useAnalysisContext: () => mockUseAnalysisContext(),
}));

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Radar: () => <div data-testid="radar" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockCropData = [
  {
    name: "Wheat",
    score: 88,
    breakdown: { ph: 90, temperature: 85, rainfall: 80, soilTexture: 95 }
  },
  {
    name: "Rice",
    score: 72,
    breakdown: { ph: 70, temperature: 75, rainfall: 80, soilTexture: 65 }
  },
  {
    name: "Tomato",
    score: 45,
    breakdown: { ph: 50, temperature: 40, rainfall: 50, soilTexture: 40 }
  }
];

describe("CropSuitabilityCard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading skeleton when context is loading and crops is empty", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { container } = render(<CropSuitabilityCard fieldId="field1" />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("should render error fallback when crops data is missing", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<CropSuitabilityCard fieldId="field1" />);
    expect(screen.getByText("Failed to Load Suitability")).toBeInTheDocument();
  });

  it("should render list of recommended crops and handle seasonal tab filtering", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { crop: mockCropData },
      isLoading: false,
    });

    render(<CropSuitabilityCard fieldId="field1" />);

    // Renders header
    expect(screen.getByText("Crop Suitability")).toBeInTheDocument();

    // Renders recommended crops
    expect(screen.getByText("Wheat")).toBeInTheDocument(); // Rabi
    expect(screen.getByText("Rice")).toBeInTheDocument();  // Kharif
    expect(screen.getByText("Tomato")).toBeInTheDocument(); // Zaid

    // Click Rabi filter tab
    const rabiTab = screen.getByRole("button", { name: "Rabi" });
    fireEvent.click(rabiTab);

    // Wheat should be visible, others should be filtered out
    expect(screen.getByText("Wheat")).toBeInTheDocument();
    expect(screen.queryByText("Rice")).not.toBeInTheDocument();
    expect(screen.queryByText("Tomato")).not.toBeInTheDocument();

    // Click Zaid filter tab
    const zaidTab = screen.getByRole("button", { name: "Zaid" });
    fireEvent.click(zaidTab);

    expect(screen.getByText("Tomato")).toBeInTheDocument();
    expect(screen.queryByText("Wheat")).not.toBeInTheDocument();
    expect(screen.queryByText("Rice")).not.toBeInTheDocument();
  });

  it("should expand breakdown values when crop item is clicked", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { crop: mockCropData },
      isLoading: false,
    });

    render(<CropSuitabilityCard fieldId="field1" />);

    // Breakdown is hidden initially
    expect(screen.queryByText("Suitability Factor Breakdown")).not.toBeInTheDocument();

    // Click Wheat to expand
    const wheatLabel = screen.getByText("Wheat");
    fireEvent.click(wheatLabel);

    expect(screen.getByText("Suitability Factor Breakdown")).toBeInTheDocument();
    expect(screen.getByText("pH match")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("Temperature match")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();

    // Click Wheat again to collapse
    fireEvent.click(wheatLabel);
    expect(screen.queryByText("Suitability Factor Breakdown")).not.toBeInTheDocument();
  });

  it("should manage crop comparison flow and limits", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { crop: mockCropData },
      isLoading: false,
    });

    render(<CropSuitabilityCard fieldId="field1" />);

    // Initially, no comparison table
    expect(screen.queryByText("Crop Comparison")).not.toBeInTheDocument();

    const wheatCheckbox = screen.getByText("Wheat").closest("div")?.querySelector("button");
    const riceCheckbox = screen.getByText("Rice").closest("div")?.querySelector("button");
    const tomatoCheckbox = screen.getByText("Tomato").closest("div")?.querySelector("button");

    expect(wheatCheckbox).not.toBeNull();
    expect(riceCheckbox).not.toBeNull();

    // Toggle Wheat comparison
    if (wheatCheckbox && riceCheckbox && tomatoCheckbox) {
      fireEvent.click(wheatCheckbox);
      // Selecting only 1 crop displays guidance: "Select at least one more crop to enable comparison."
      expect(screen.getByText("Select at least one more crop to enable comparison.")).toBeInTheDocument();

      // Toggle Rice comparison
      fireEvent.click(riceCheckbox);

      // Now we should have 2 selected. Compare panel renders.
      expect(screen.getByText("Crop Comparison")).toBeInTheDocument();
      // Winner banner should display Wheat as best match
      expect(screen.getByText("Best Selection Match")).toBeInTheDocument();
      expect(screen.getByText(/is the most suitable crop with a/)).toBeInTheDocument();

      // Verify table displays stats
      expect(screen.getByText("pH Match")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument(); // Wheat pH
      expect(screen.getByText("70%")).toBeInTheDocument(); // Rice pH

      // Toggle Tomato comparison (3 selected)
      fireEvent.click(tomatoCheckbox);
      expect(screen.getByText("3 selected")).toBeInTheDocument();

      // Clear comparison using the button in the compare section
      const clearBtn = screen.getByRole("button", { name: /Clear Comparison/i });
      fireEvent.click(clearBtn);

      expect(screen.queryByText("Crop Comparison")).not.toBeInTheDocument();
    }
  });
});
