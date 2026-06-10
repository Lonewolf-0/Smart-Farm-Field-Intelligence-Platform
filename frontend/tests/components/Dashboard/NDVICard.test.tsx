import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import NDVICard from "../../../src/components/Dashboard/NDVICard";

// Mock the analysis context hook
const mockUseAnalysisContext = vi.fn();
vi.mock("../../../src/context/AnalysisContext", () => ({
  useAnalysisContext: () => mockUseAnalysisContext(),
}));

// Mock recharts to avoid SVG sizing errors inside jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data }: any) => (
    <div data-testid="pie">
      {data.map((d: any, i: number) => (
        <span key={i} data-testid={`pie-cell-${d.name}`} data-value={d.value}>
          {d.name}: {d.value}
        </span>
      ))}
      {children}
    </div>
  ),
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe("NDVICard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading skeleton when context is loading and no data is present", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { container } = render(<NDVICard fieldId="field1" />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("should render fallback text when ndvi data is missing", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<NDVICard fieldId="field1" />);
    expect(screen.getByText("Satellite data unavailable. Try running analysis again.")).toBeInTheDocument();
  });

  it("should render NDVI health data correctly for Excellent health status", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: {
        ndvi: {
          averageNDVI: 0.85,
          healthScore: "Excellent",
          healthPercentage: 92,
          stressAreas: 8,
          lastImageDate: "2026-06-05T00:00:00.000Z",
          warning: "No issues detected"
        }
      },
      isLoading: false,
    });

    render(<NDVICard fieldId="field1" />);

    expect(screen.getByText("Vegetation Health")).toBeInTheDocument();
    expect(screen.getByText("Excellent")).toBeInTheDocument();
    expect(screen.getByText("0.85")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("92.0%")).toBeInTheDocument();
    expect(screen.getByText("Stressed")).toBeInTheDocument();
    expect(screen.getByText("8.0%")).toBeInTheDocument();
    expect(screen.getByText("NDVI Guide:")).toBeInTheDocument();
    expect(screen.getByText(/Last image:/)).toBeInTheDocument();
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("should render yellow warning badge and display warning text when health status is Moderate", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: {
        ndvi: {
          averageNDVI: 0.45,
          healthScore: "Moderate",
          healthPercentage: 70,
          stressAreas: 30,
          lastImageDate: "2026-06-05T00:00:00.000Z",
          warning: "Moderate moisture stress detected in northwest quadrant"
        }
      },
      isLoading: false,
    });

    render(<NDVICard fieldId="field1" />);

    expect(screen.getByText("Moderate")).toBeInTheDocument();
    expect(screen.getByText("0.45")).toBeInTheDocument();
    expect(screen.getByText("70.0%")).toBeInTheDocument();
    expect(screen.getByText("30.0%")).toBeInTheDocument();
    expect(screen.getByText("Moderate moisture stress detected in northwest quadrant")).toBeInTheDocument();
  });

  it("should render red badge when health status is Poor", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: {
        ndvi: {
          averageNDVI: 0.22,
          healthScore: "Poor",
          healthPercentage: 45,
          stressAreas: 55,
          lastImageDate: "2026-06-05T00:00:00.000Z",
        }
      },
      isLoading: false,
    });

    render(<NDVICard fieldId="field1" />);

    expect(screen.getByText("Poor")).toBeInTheDocument();
    expect(screen.getByText("0.22")).toBeInTheDocument();
    expect(screen.getByText("45.0%")).toBeInTheDocument();
    expect(screen.getByText("55.0%")).toBeInTheDocument();
  });
});
