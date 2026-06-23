import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import PesticideCard from "../../../src/components/Dashboard/PesticideCard";
import api from "../../../src/services/api";

// Mock the analysis context hook
const mockUseAnalysisContext = vi.fn();
vi.mock("../../../src/context/AnalysisContext", () => ({
  useAnalysisContext: () => mockUseAnalysisContext(),
}));

// Mock API client
vi.mock("../../../src/services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockPestData = {
  crop: "Wheat",
  growthStage: "Tillering",
  season: "Rabi",
  assessments: [
    {
      pestName: "Aphids",
      riskLevel: "High",
      riskScore: 85,
      recommendation: "Apply systemic insecticide early morning.",
      treatment: {
        productName: "PestShield Extra",
        activeIngredient: "Imidacloprid",
        dosage: "100 ml/ha",
        applicationMethod: "Foliar Spray",
        frequency: "Once a week",
        safetyInterval: 14,
        precautions: ["Wear protective gloves.", "Avoid spraying during high winds."]
      }
    },
    {
      pestName: "Armyworm",
      riskLevel: "Low",
      riskScore: 20,
      recommendation: "Monitor fields regularly.",
      treatment: null
    }
  ]
};

describe("PesticideCard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading animation when context is loading and no data is present", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: true,
    });

    const { container } = render(<PesticideCard fieldId="field1" selectedCrop="Wheat" />);

    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("should render error message when API call fails", async () => {
    mockUseAnalysisContext.mockReturnValue({
      data: null,
      isLoading: false,
    });
    vi.mocked(api.post).mockRejectedValueOnce(new Error("API Error"));

    render(<PesticideCard fieldId="field1" selectedCrop="Wheat" />);

    await waitFor(() => {
      expect(screen.getByText("API Error")).toBeInTheDocument();
    });
  });

  it("should render list of pest risk assessments correctly", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { pesticide: mockPestData },
      isLoading: false,
    });

    render(<PesticideCard fieldId="field1" selectedCrop="Wheat" />);

    expect(screen.getByText("Pest Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("Aphids")).toBeInTheDocument();
    expect(screen.getByText("Armyworm")).toBeInTheDocument();
    expect(screen.getByText("High Risk")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("should trigger API post and recalculate when a new crop is selected from dropdown", async () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { pesticide: mockPestData },
      isLoading: false,
    });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true, data: { ...mockPestData, crop: "Rice" } }
    });

    render(<PesticideCard fieldId="field1" selectedCrop="Wheat" />);

    const cropSelect = screen.getByRole("combobox");
    await userEvent.selectOptions(cropSelect, "Rice");

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/analysis/field1/pesticide",
        expect.objectContaining({ crop: "Rice" })
      );
    });
  });

  it("should expand and collapse treatment details when details button is clicked", () => {
    mockUseAnalysisContext.mockReturnValue({
      data: { pesticide: mockPestData },
      isLoading: false,
    });

    render(<PesticideCard fieldId="field1" selectedCrop="Wheat" />);

    // By default details are closed (Active ingredient is not visible)
    const aphidsToggle = screen.getByText("Aphids").closest(".cursor-pointer");
    expect(aphidsToggle).not.toBeNull();
    
    if (aphidsToggle) {
      fireEvent.click(aphidsToggle);
      expect(screen.getByText("PestShield Extra")).toBeInTheDocument();
      expect(screen.getByText("Imidacloprid")).toBeInTheDocument();
      expect(screen.getByText("100 ml/ha")).toBeInTheDocument();

      // Collapse it
      fireEvent.click(aphidsToggle);
      expect(screen.queryByText("PestShield Extra")).not.toBeInTheDocument();
    }
  });


});
