import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import DashboardPage from "../../src/pages/DashboardPage";
import api from "../../src/services/api";
import { connectRiskStream } from "../../src/services/riskStream";

// Mock sub-components
vi.mock("../../src/components/Dashboard/SoilCard", () => ({
  default: () => <div data-testid="soil-card">SoilCard</div>,
}));
vi.mock("../../src/components/Dashboard/IrrigationCard", () => ({
  default: () => <div data-testid="irrigation-card">IrrigationCard</div>,
}));
vi.mock("../../src/components/Dashboard/WeatherCard", () => ({
  default: () => <div data-testid="weather-card">WeatherCard</div>,
}));
vi.mock("../../src/components/Dashboard/CropSuitabilityCard", () => ({
  default: () => <div data-testid="crop-card">CropSuitabilityCard</div>,
}));
vi.mock("../../src/components/Dashboard/FertilizerCard", () => ({
  default: () => <div data-testid="fertilizer-card">FertilizerCard</div>,
}));
vi.mock("../../src/components/Dashboard/NDVICard", () => ({
  default: () => <div data-testid="ndvi-card">NDVICard</div>,
}));
vi.mock("../../src/components/Dashboard/PesticideCard", () => ({
  default: () => <div data-testid="pesticide-card">PesticideCard</div>,
}));
vi.mock("../../src/components/Dashboard/RiskAlertCard", () => ({
  default: ({ onCriticalAlerts }: any) => {
    // Provide a way to manually trigger critical alerts for testing
    return (
      <div data-testid="risk-alert-card">
        RiskAlertCard
        <button
          data-testid="trigger-critical-alert"
          onClick={() =>
            onCriticalAlerts([
              { message: "Test Critical Alert", expectedDate: "2023-10-10", recommendation: "Do something" },
            ])
          }
        >
          Trigger Alert
        </button>
      </div>
    );
  },
}));

// Mock API
vi.mock("../../src/services/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock riskStream
vi.mock("../../src/services/riskStream", () => ({
  connectRiskStream: vi.fn(),
}));

// Mock notifications
vi.mock("../../src/utils/notification", () => ({
  showNotification: vi.fn(),
}));

// Mock FieldContext
const mockUseField = vi.fn();
vi.mock("../../src/context/FieldContext", () => ({
  useField: () => mockUseField(),
}));

describe("DashboardPage Component Tests", () => {
  const mockFields = [
    { id: "field-1", name: "Field 1", area: 10 },
    { id: "field-2", name: "Field 2", area: 20 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Default mock setup for FieldContext
    mockUseField.mockReturnValue({
      fields: mockFields,
      isLoadingFields: false,
      selectedFieldId: "field-1",
      setSelectedFieldId: vi.fn(),
    });

    // Default mock setup for connectRiskStream
    vi.mocked(connectRiskStream).mockReturnValue({
      close: vi.fn(),
    } as any);

    // Default mock setup for window.Notification
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: vi.fn().mockResolvedValue('granted'),
        },
        writable: true,
      });
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should display loading state when fields are loading", () => {
    mockUseField.mockReturnValue({
      fields: [],
      isLoadingFields: true,
      selectedFieldId: null,
      setSelectedFieldId: vi.fn(),
    });

    render(<DashboardPage />);
    expect(screen.getByText("Loading fields...")).toBeInTheDocument();
  });

  it("should display empty state banner when no fields are saved", () => {
    mockUseField.mockReturnValue({
      fields: [],
      isLoadingFields: false,
      selectedFieldId: null,
      setSelectedFieldId: vi.fn(),
    });

    render(<DashboardPage />);
    expect(screen.getByText(/You haven't saved any fields yet/i)).toBeInTheDocument();
  });

  it("should render overview tab by default", () => {
    // Inject a cached analysis to bypass "No Analysis Data" screen
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: Date.now(), results: { weather: {}, ndvi: {}, risks: [] } })
    );

    render(<DashboardPage />);

    // Check if overview components are rendered
    expect(screen.getByTestId("weather-card")).toBeInTheDocument();
    expect(screen.getByTestId("risk-alert-card")).toBeInTheDocument();
    expect(screen.getByTestId("ndvi-card")).toBeInTheDocument();

    // Check if other components are not rendered
    expect(screen.queryByTestId("soil-card")).not.toBeInTheDocument();
  });

  it("should switch to soil tab when clicked", async () => {
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: Date.now(), results: { soil: {} } })
    );

    render(<DashboardPage />);

    const soilTab = screen.getByRole("button", { name: /soil/i });
    await userEvent.click(soilTab);

    expect(screen.getByTestId("soil-card")).toBeInTheDocument();
    expect(screen.getByTestId("crop-card")).toBeInTheDocument();
  });

  it("should display stale warning if data is older than 24 hours", () => {
    const timestamp25HoursAgo = Date.now() - (25 * 60 * 60 * 1000);
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: timestamp25HoursAgo, results: { weather: {} } })
    );

    render(<DashboardPage />);

    expect(screen.getByText("DATA MAY BE OUTDATED")).toBeInTheDocument();
  });

  it("should trigger analyze field logic correctly", async () => {
    vi.mocked(api.post).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { success: true, data: {} } }), 100)));
    vi.mocked(api.get).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { success: true, data: {} } }), 100)));

    render(<DashboardPage />);

    const analyzeButton = screen.getByRole("button", { name: /Run First Analysis/i });

    // Trigger click without awaiting so we can check the loading state
    fireEvent.click(analyzeButton);

    expect(await screen.findByText("Analyzing Field Data...")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/analysis/field-1/soil");
      expect(api.post).toHaveBeenCalledWith("/analysis/field-1/risks");
    });
  });

  it("should display critical alert banner when RiskAlertCard triggers it", () => {
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: Date.now(), results: { weather: {} } })
    );

    render(<DashboardPage />);

    const triggerButton = screen.getByTestId("trigger-critical-alert");
    fireEvent.click(triggerButton);

    expect(screen.getByText("CRITICAL WARNING ACTIVE")).toBeInTheDocument();
    expect(screen.getByText(/Test Critical Alert/i)).toBeInTheDocument();
  });
});
