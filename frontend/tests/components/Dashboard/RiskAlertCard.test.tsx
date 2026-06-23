import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import RiskAlertCard from "../../../src/components/Dashboard/RiskAlertCard";
import type { RiskAlert } from "../../../src/types";

// Mock the analysis context hook
const mockUseAnalysisContext = vi.fn();
vi.mock("../../../src/context/AnalysisContext", () => ({
  useAnalysisContext: () => mockUseAnalysisContext(),
}));

const mockAlerts: RiskAlert[] = [
  {
    type: "heat_stress",
    severity: "critical",
    message: "High temperature expected to exceed crop threshold.",
    expectedDate: "2026-06-10",
    duration: "3 days",
    recommendation: "Increase irrigation frequency and apply mulch to retain moisture."
  },
  {
    type: "frost",
    severity: "high",
    message: "Sudden temperature drop might cause frost damage.",
    expectedDate: "2026-06-12",
    duration: "1 night",
    recommendation: "Use row covers or overhead sprinklers."
  },
  {
    type: "heavy_rain",
    severity: "medium",
    message: "Heavy rain might cause soil erosion.",
    expectedDate: "2026-06-15",
    duration: "2 days",
    recommendation: "Ensure proper field drainage."
  },
  {
    type: "hail",
    severity: "low",
    message: "Light hail forecast.",
    expectedDate: "2026-06-18",
    duration: "1 hour",
    recommendation: "Monitor crops for physical damage."
  }
];

describe("RiskAlertCard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render loading skeleton when context is loading", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<RiskAlertCard fieldId="field-123" />);

    const loaders = document.getElementsByClassName("animate-pulse");
    expect(loaders.length).toBeGreaterThan(0);
  });

  it("should render active risk warnings when data is loaded", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { risks: mockAlerts },
      isLoading: false,
    });

    render(<RiskAlertCard fieldId="field-123" />);

    expect(screen.getByText("Active Risk Warnings")).toBeInTheDocument();
    expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();
    expect(screen.getByText("Frost Warning")).toBeInTheDocument();
    expect(screen.getByText("Heavy Rain Alert")).toBeInTheDocument();
    expect(screen.getByText("Hailstorm Alert")).toBeInTheDocument();
  });

  it("should display the correct severity background colors and badges", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { risks: mockAlerts },
      isLoading: false,
    });

    render(<RiskAlertCard fieldId="field-123" />);

    expect(screen.getByTestId("risk-alert-critical")).toBeInTheDocument();

    const criticalCard = screen.getByTestId("risk-alert-critical");
    expect(criticalCard).toHaveClass("bg-slate-900/40");
    expect(criticalCard).toHaveClass("border-red-500/50");
    expect(screen.getByText("Critical Alert")).toBeInTheDocument();

    const highCard = screen.getByTestId("risk-alert-high");
    expect(highCard).toHaveClass("bg-slate-900/40");
    expect(highCard).toHaveClass("border-orange-500/50");
    expect(screen.getByText("High Risk")).toBeInTheDocument();

    const mediumCard = screen.getByTestId("risk-alert-medium");
    expect(mediumCard).toHaveClass("bg-slate-900/40");
    expect(mediumCard).toHaveClass("border-amber-500/50");
    expect(screen.getByText("Medium Risk")).toBeInTheDocument();

    const lowCard = screen.getByTestId("risk-alert-low");
    expect(lowCard).toHaveClass("bg-slate-900/40");
    expect(lowCard).toHaveClass("border-emerald-500/30");
    expect(screen.getByText("Informational")).toBeInTheDocument();
  });

  it("should expand and collapse recommended actions when toggle is clicked", async () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { risks: mockAlerts },
      isLoading: false,
    });

    render(<RiskAlertCard fieldId="field-123" />);

    expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();

    // By default, recommendation should not be visible
    expect(screen.queryByText("Increase irrigation frequency and apply mulch to retain moisture.")).not.toBeInTheDocument();

    // Find the toggle button for critical alert (first alert with recommendation)
    const toggleButtons = screen.getAllByTitle("View action steps");
    expect(toggleButtons.length).toBeGreaterThan(0);

    // Expand the recommendation
    fireEvent.click(toggleButtons[0]);
    expect(screen.getByText("Increase irrigation frequency and apply mulch to retain moisture.")).toBeInTheDocument();

    // Collapse the recommendation
    const collapseButton = screen.getByTitle("Hide action steps");
    fireEvent.click(collapseButton);
    expect(screen.queryByText("Increase irrigation frequency and apply mulch to retain moisture.")).not.toBeInTheDocument();
  });

  it("should dismiss an alert and persist it in localStorage", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { risks: mockAlerts },
      isLoading: false,
    });

    render(<RiskAlertCard fieldId="field-123" />);

    expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();

    const dismissButtons = screen.getAllByTitle("Dismiss alert");
    expect(dismissButtons.length).toBe(4);

    // Dismiss the critical alert (index 0)
    fireEvent.click(dismissButtons[0]);

    // Check that it's removed from UI
    expect(screen.queryByText("Heat Stress Warning")).not.toBeInTheDocument();
    
    // Remaining active count should update to 3
    expect(screen.getByText("3 active")).toBeInTheDocument();

    // Check localStorage persistence
    const dismissedInStorage = localStorage.getItem("dismissed_risks");
    expect(dismissedInStorage).toBeDefined();
    expect(JSON.parse(dismissedInStorage!)).toContain("field-123_heat_stress_2026-06-10");
  });

  it("should display 'All Clear' state when there are no alerts", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { risks: [] },
      isLoading: false,
    });

    render(<RiskAlertCard fieldId="field-123" />);

    expect(screen.getByTestId("no-risk-state")).toBeInTheDocument();
    expect(screen.getByText("All Clear")).toBeInTheDocument();
    expect(screen.getByText("No active risks. Your field conditions are normal.")).toBeInTheDocument();
  });

  it("should call onCriticalAlerts callback with active critical alerts", async () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { risks: mockAlerts },
      isLoading: false,
    });

    const onCriticalAlertsMock = vi.fn();

    render(<RiskAlertCard fieldId="field-123" onCriticalAlerts={onCriticalAlertsMock} />);

    expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();

    // Callback should be called initially with the critical alert
    expect(onCriticalAlertsMock).toHaveBeenCalledWith([mockAlerts[0]]);

    // Dismiss critical alert
    const dismissButtons = screen.getAllByTitle("Dismiss alert");
    fireEvent.click(dismissButtons[0]);

    // Callback should now be called with an empty list
    await waitFor(() => {
      expect(onCriticalAlertsMock).toHaveBeenLastCalledWith([]);
    });
  });

  it("should display unavailable state when risks data is missing and loading is false", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<RiskAlertCard fieldId="field-123" />);

    expect(screen.getByText("Risk Assessment Unavailable")).toBeInTheDocument();
  });
});
