import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Mock the auth context hook
const mockUseAuth = vi.fn();
vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockSave = vi.fn();
const mockOutput = vi.fn().mockReturnValue("blob://some-url");
const mockAddPage = vi.fn();
const mockSetPage = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockSetTextColor = vi.fn();
const mockSetFillColor = vi.fn();
const mockSetDrawColor = vi.fn();
const mockSetLineWidth = vi.fn();
const mockLine = vi.fn();
const mockRect = vi.fn();
const mockText = vi.fn();
const mockSplitTextToSize = vi.fn().mockImplementation((text) => [text]);
const mockGetTextWidth = vi.fn().mockReturnValue(10);

vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        internal: {
          pageSize: {
            getWidth: () => 210,
            getHeight: () => 297,
          },
          getNumberOfPages: () => 1,
        },
        save: mockSave,
        output: mockOutput,
        addPage: mockAddPage,
        setPage: mockSetPage,
        setFont: mockSetFont,
        setFontSize: mockSetFontSize,
        setTextColor: mockSetTextColor,
        setFillColor: mockSetFillColor,
        setDrawColor: mockSetDrawColor,
        setLineWidth: mockSetLineWidth,
        line: mockLine,
        rect: mockRect,
        text: mockText,
        splitTextToSize: mockSplitTextToSize,
        getTextWidth: mockGetTextWidth,
        lastAutoTable: { finalY: 100 },
      };
    }),
  };
});

vi.mock("jspdf-autotable", () => {
  return {
    default: vi.fn().mockImplementation((doc) => {
      doc.lastAutoTable = { finalY: 150 };
    }),
  };
});

describe("DashboardPage Component Tests", () => {
  const mockFields = [
    { id: "field-1", name: "Field 1", area: 10 },
    { id: "field-2", name: "Field 2", area: 20 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockSave.mockClear();
    mockOutput.mockClear();
    mockAddPage.mockClear();
    mockSetPage.mockClear();
    mockSetFont.mockClear();
    mockSetFontSize.mockClear();
    mockSetTextColor.mockClear();
    mockSetFillColor.mockClear();
    mockSetDrawColor.mockClear();
    mockSetLineWidth.mockClear();
    mockLine.mockClear();
    mockRect.mockClear();
    mockText.mockClear();
    mockSplitTextToSize.mockClear();
    mockGetTextWidth.mockClear();

    mockUseAuth.mockReturnValue({
      user: { name: "Test User", email: "testuser@example.com" },
    });

    // Default mock setup for FieldContext
    mockUseField.mockReturnValue({
      fields: mockFields,
      isLoadingFields: false,
      selectedFieldId: "field-1",
      setSelectedFieldId: vi.fn(),
    });

    vi.mocked(connectRiskStream).mockReturnValue({
      close: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // Check if other components are not rendered
    expect(screen.queryByTestId("soil-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ndvi-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("risk-alert-card")).not.toBeInTheDocument();
  });

  it("should switch to crop health tab when clicked", async () => {
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: Date.now(), results: { soil: {} } })
    );

    render(<DashboardPage />);

    const cropHealthTab = screen.getByRole("button", { name: /crop health/i });
    await userEvent.click(cropHealthTab);

    expect(screen.getByTestId("soil-card")).toBeInTheDocument();
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

  it("should display critical alert banner when RiskAlertCard triggers it", async () => {
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: Date.now(), results: { weather: {} } })
    );

    render(<DashboardPage />);

    const cropHealthTab = screen.getByRole("button", { name: /crop health/i });
    fireEvent.click(cropHealthTab);

    const triggerButton = await screen.findByTestId("trigger-critical-alert");
    fireEvent.click(triggerButton);

    expect(screen.getByText("CRITICAL WARNING ACTIVE")).toBeInTheDocument();
    expect(screen.getByText(/Test Critical Alert/i)).toBeInTheDocument();
  });

  it("should render View Report and Download PDF buttons on the agronomy tab", async () => {
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: Date.now(), results: { crop: [], irrigation: {}, fertilizer: {} } })
    );

    render(<DashboardPage />);

    const agronomyTab = screen.getByRole("button", { name: /Agronomy Recs/i });
    fireEvent.click(agronomyTab);

    expect(screen.getByRole("button", { name: /View Report/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PDF/i })).toBeInTheDocument();
  });

  it("should trigger PDF download with correct filename when Download PDF is clicked", async () => {
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: Date.now(), results: { crop: [], irrigation: {}, fertilizer: {} } })
    );
    localStorage.setItem("selectedCrop", "Wheat");

    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: {
          soilBaselines: { nitrogen: 60, phosphorus: 40, potassium: 50 },
          recommendations: [
            { name: "Urea", quantity: 50, unit: "kg" }
          ],
          scheduleSteps: [
            { days: 0, stage: "Basal", description: "Apply Urea", recommendations: [{ name: "Urea", quantity: 50 }] }
          ]
        }
      }
    });

    render(<DashboardPage />);

    const agronomyTab = screen.getByRole("button", { name: /Agronomy Recs/i });
    fireEvent.click(agronomyTab);

    const downloadButton = screen.getByRole("button", { name: /Download PDF/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith("test_user_field_1_wheat.pdf");
    });
  });

  it("should open a new window and load the generated blob URL when View Report is clicked", async () => {
    localStorage.setItem(
      "dashboard_analysis_field-1",
      JSON.stringify({ timestamp: Date.now(), results: { crop: [], irrigation: {}, fertilizer: {} } })
    );
    localStorage.setItem("selectedCrop", "Rice");

    const mockWrite = vi.fn();
    const mockLocation = { href: "" };
    const mockWindow = {
      document: {
        write: mockWrite,
      },
      location: mockLocation,
      close: vi.fn(),
    };
    const mockWindowOpen = vi.fn().mockReturnValue(mockWindow);
    vi.stubGlobal("open", mockWindowOpen);

    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        data: {
          soilBaselines: { nitrogen: 60, phosphorus: 40, potassium: 50 },
          recommendations: [
            { name: "Urea", quantity: 50, unit: "kg" }
          ],
          scheduleSteps: [
            { days: 0, stage: "Basal", description: "Apply Urea", recommendations: [{ name: "Urea", quantity: 50 }] }
          ]
        }
      }
    });

    render(<DashboardPage />);

    const agronomyTab = screen.getByRole("button", { name: /Agronomy Recs/i });
    fireEvent.click(agronomyTab);

    const viewButton = screen.getByRole("button", { name: /View Report/i });
    fireEvent.click(viewButton);

    expect(mockWindowOpen).toHaveBeenCalledWith("", "_blank");
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining("Generating PDF report..."));

    await waitFor(() => {
      expect(mockOutput).toHaveBeenCalledWith("bloburl");
      expect(mockLocation.href).toBe("blob://some-url");
    });
  });
});
