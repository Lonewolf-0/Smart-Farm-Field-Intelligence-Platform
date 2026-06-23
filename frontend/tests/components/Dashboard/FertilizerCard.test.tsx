import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import FertilizerCard from "../../../src/components/Dashboard/FertilizerCard";
import api from "../../../src/services/api";

// Mock the analysis context hook
const mockUseAnalysisContext = vi.fn();
vi.mock("../../../src/context/AnalysisContext", () => ({
  useAnalysisContext: () => mockUseAnalysisContext(),
}));

// Mock API client methods
vi.mock("../../../src/services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("FertilizerCard Component Tests", () => {
  const mockField = {
    id: "field1",
    name: "North Field",
    area: 2.5,
  };

  const mockSoilHistory = {
    records: [
      {
        id: 1,
        year: 2025,
        season: "Kharif",
        data: {
          layers: [
            {
              nitrogen: 80,
              ph: 6.5,
            },
          ],
        },
      },
    ],
  };

  const mockInitialPlan = {
    soilBaselines: {
      nitrogen: 80,
      phosphorus: 40,
      potassium: 50,
    },
    liveDataAdjustments: [
      { type: "info", message: "Favorable dense vegetation reported." },
    ],
    n: { available: 40, required: 120, deficit: 80, percentageAvailable: 33, percentageDeficit: 67 },
    p: { available: 16, required: 60, deficit: 44, percentageAvailable: 27, percentageDeficit: 73 },
    k: { available: 30, required: 40, deficit: 10, percentageAvailable: 75, percentageDeficit: 25 },
    recommendations: [
      { name: "Urea", quantity: 174 },
      { name: "DAP", quantity: 96 },
      { name: "MOP", quantity: 17 },
    ],
    totalCostPerHa: 154,
    scheduleSteps: [
      { stage: "Basal", dayOffset: 0, ureaKg: 50, dapKg: 96, mopKg: 17, description: "At sowing" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAnalysisContext.mockReturnValue({
      data: { fertilizer: mockInitialPlan },
      isLoading: false,
    });
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes("/fields")) {
        return Promise.resolve({ data: { success: true, data: [mockField] } });
      }
      if (url.includes("/soil/history")) {
        return Promise.resolve({ data: { success: true, data: mockSoilHistory } });
      }
      return Promise.reject(new Error("Not found"));
    });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: mockInitialPlan } });
  });

  it("should render loading animation when context is loading and no plan is present", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { container } = render(<FertilizerCard fieldId="field1" selectedCrop="Wheat" onCropChange={() => {}} />);

    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("should not render NPK input fields when 'Using Soil Test Data' is active", async () => {
    render(<FertilizerCard fieldId="field1" selectedCrop="Wheat" onCropChange={() => {}} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/fields");
    });

    // Inputs should not be in the DOM by default
    expect(screen.queryByLabelText(/Soil N/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Soil P/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Soil K/)).not.toBeInTheDocument();
  });

  it("should enable input fields and allow typing when toggled to 'Manual NPK Override'", async () => {
    render(<FertilizerCard fieldId="field1" selectedCrop="Wheat" onCropChange={() => {}} />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/fields");
    });

    const toggleBtn = screen.getByRole("button", { name: /Soil Data/ });
    fireEvent.click(toggleBtn);

    // Toggle text should update
    expect(screen.getByText("Manual NPK")).toBeInTheDocument();

    const nInput = screen.getByLabelText(/Soil N/);
    const pInput = screen.getByLabelText(/Soil P/);
    const kInput = screen.getByLabelText(/Soil K/);

    expect(nInput).not.toBeDisabled();
    expect(pInput).not.toBeDisabled();
    expect(kInput).not.toBeDisabled();

    // Type a new value
    await userEvent.clear(nInput);
    await userEvent.type(nInput, "90");
    expect(nInput).toHaveValue(90);
  });

});
