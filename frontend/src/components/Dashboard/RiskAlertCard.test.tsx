import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RiskAlertCard from "./RiskAlertCard";
import api from "../../services/api";
import type { RiskAlert } from "../../types";

vi.mock("../../services/api", () => {
  return {
    default: {
      post: vi.fn(),
    },
  };
});

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

describe("RiskAlertCard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should render loading skeleton initially and then the risk alerts", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: mockAlerts },
    });

    render(<RiskAlertCard fieldId="field-123" />);

    // Check loading state (uses skeleton styling)
    const loaders = document.getElementsByClassName("animate-pulse");
    expect(loaders.length).toBeGreaterThan(0);

    // Wait for the alerts to render
    await waitFor(() => {
      expect(screen.getByText("Active Risk Warnings")).toBeInTheDocument();
    });

    // Check alert titles
    expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();
    expect(screen.getByText("Frost Warning")).toBeInTheDocument();
    expect(screen.getByText("Heavy Rain Alert")).toBeInTheDocument();
    expect(screen.getByText("Hailstorm Alert")).toBeInTheDocument();
  });

  it("should display the correct severity background colors and badges", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: mockAlerts },
    });

    render(<RiskAlertCard fieldId="field-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("risk-alert-critical")).toBeInTheDocument();
    });

    // Critical Alert Styling Check
    const criticalCard = screen.getByTestId("risk-alert-critical");
    expect(criticalCard).toHaveClass("bg-red-500/10");
    expect(criticalCard).toHaveClass("border-red-500/30");
    expect(screen.getByText("Critical Alert")).toBeInTheDocument();

    // High Alert Styling Check
    const highCard = screen.getByTestId("risk-alert-high");
    expect(highCard).toHaveClass("bg-orange-500/10");
    expect(highCard).toHaveClass("border-orange-500/30");
    expect(screen.getByText("High Risk")).toBeInTheDocument();

    // Medium Alert Styling Check
    const mediumCard = screen.getByTestId("risk-alert-medium");
    expect(mediumCard).toHaveClass("bg-amber-500/10");
    expect(mediumCard).toHaveClass("border-amber-500/30");
    expect(screen.getByText("Medium Risk")).toBeInTheDocument();

    // Low Alert Styling Check
    const lowCard = screen.getByTestId("risk-alert-low");
    expect(lowCard).toHaveClass("bg-blue-500/10");
    expect(lowCard).toHaveClass("border-blue-500/30");
    expect(screen.getByText("Informational")).toBeInTheDocument();
  });

  it("should expand and collapse recommended actions when toggle is clicked", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: mockAlerts },
    });

    render(<RiskAlertCard fieldId="field-123" />);

    await waitFor(() => {
      expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();
    });

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

  it("should dismiss an alert and persist it in localStorage", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: mockAlerts },
    });

    render(<RiskAlertCard fieldId="field-123" />);

    await waitFor(() => {
      expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();
    });

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

  it("should display 'All Clear' state when there are no alerts", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    render(<RiskAlertCard fieldId="field-123" />);

    await waitFor(() => {
      expect(screen.getByTestId("no-risk-state")).toBeInTheDocument();
    });

    expect(screen.getByText("All Clear")).toBeInTheDocument();
    expect(screen.getByText("No active risks. Your field conditions are normal.")).toBeInTheDocument();
  });

  it("should call onCriticalAlerts callback with active critical alerts", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: mockAlerts },
    });

    const onCriticalAlertsMock = vi.fn();

    render(<RiskAlertCard fieldId="field-123" onCriticalAlerts={onCriticalAlertsMock} />);

    await waitFor(() => {
      expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();
    });

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

  it("should display error state and allow retrying the fetch", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("Network Failure"));

    render(<RiskAlertCard fieldId="field-123" />);

    await waitFor(() => {
      expect(screen.getByText("Risk Assessment Failed")).toBeInTheDocument();
    });

    expect(screen.getByText("Network Failure")).toBeInTheDocument();

    // Now resolve successfully for the retry
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: mockAlerts },
    });

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);

    // Check loading skeleton again after click
    const loaders = document.getElementsByClassName("animate-pulse");
    expect(loaders.length).toBeGreaterThan(0);

    // Wait for the alerts to render
    await waitFor(() => {
      expect(screen.getByText("Active Risk Warnings")).toBeInTheDocument();
    });

    expect(screen.getByText("Heat Stress Warning")).toBeInTheDocument();
  });
});
