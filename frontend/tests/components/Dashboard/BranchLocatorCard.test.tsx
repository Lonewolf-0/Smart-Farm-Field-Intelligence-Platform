import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import BranchLocatorCard from "../../../src/components/Dashboard/BranchLocatorCard";
import api from "../../../src/services/api";

// Mock API client
vi.mock("../../../src/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockFields = [
  {
    id: "field1",
    name: "Wheat Field East",
    centroid: { lat: 18.52, lng: 73.85 },
  },
  {
    id: "field2",
    name: "Barren Field West",
  },
];

const mockBranch = {
  id: "branch123",
  name: "Nutrien Ag Solutions Pune",
  address: "123 Seed Highway, Hadapsar, Pune, MH, 411028",
  distance: 4.828, // km
  products: [
    { name: "Premium Urea Fertilizer", price: 320, unit: "bag" },
    { name: "High Grade DAP (Diammonium Phosphate)", price: 850, unit: "bag" },
  ],
  services: ["Soil Testing", "Agronomy Consultation", "Seed Cleaning"],
};

describe("BranchLocatorCard Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading skeleton initially", async () => {
    // Keep it pending
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <MemoryRouter>
        <BranchLocatorCard fieldId="field1" />
      </MemoryRouter>
    );

    expect(container.firstChild).toHaveClass("animate-pulse");
    expect(screen.queryByText("Nearest Branch")).not.toBeInTheDocument();
  });

  it("should render error fallback when fields api request fails", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <BranchLocatorCard fieldId="field1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Unable to locate nearest branch.")).toBeInTheDocument();
    });
  });

  it("should render error fallback when field centroid is missing", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockFields },
    });

    render(
      <MemoryRouter>
        <BranchLocatorCard fieldId="field2" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Unable to locate nearest branch.")).toBeInTheDocument();
    });
  });

  it("should render error fallback when no nearby branch is returned", async () => {
    // 1. mock /fields
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockFields },
    });
    // 2. mock /branches/nearest to return empty array
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    render(
      <MemoryRouter>
        <BranchLocatorCard fieldId="field1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No branches found nearby.")).toBeInTheDocument();
    });
  });

  it("should successfully fetch and render nearest branch information", async () => {
    // 1. mock /fields
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockFields },
    });
    // 2. mock /branches/nearest
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: [mockBranch] },
    });

    render(
      <MemoryRouter>
        <BranchLocatorCard fieldId="field1" />
      </MemoryRouter>
    );

    // Assert that fields endpoint was loaded
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/fields");
    });

    // Assert nearest branch endpoint was called with correct coordinate query params
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/branches/nearest?lat=18.52&lng=73.85&limit=1");
    });

    // Verify UI components rendered correct data
    expect(screen.getByText("Nearest Branch")).toBeInTheDocument();
    const expectedMiles = (mockBranch.distance * 0.621371).toFixed(1); // 4.828 * 0.621371 = 3.0
    expect(screen.getByText(`${expectedMiles} miles away`)).toBeInTheDocument();
    expect(screen.getByText("Nutrien Ag Solutions Pune")).toBeInTheDocument();
    expect(screen.getByText("123 Seed Highway, Hadapsar, Pune, MH, 411028")).toBeInTheDocument();

    // Verify products rendering
    expect(screen.getByText("Premium Urea Fertilizer")).toBeInTheDocument();
    // The price is rendered like: <span className="font-medium text-emerald-400">${urea.price}<span className="text-xs text-slate-500">/{urea.unit}</span></span>
    // which results in "$320/bag" text content
    const priceTextUrea = screen.getByText((content, element) => {
      return element?.textContent === "$320/bag";
    });
    expect(priceTextUrea).toBeInTheDocument();

    expect(screen.getByText("High Grade DAP (Diammonium Phosphate)")).toBeInTheDocument();
    const priceTextDAP = screen.getByText((content, element) => {
      return element?.textContent === "$850/bag";
    });
    expect(priceTextDAP).toBeInTheDocument();

    // Verify services tags (limit 3)
    expect(screen.getByText("Soil Testing")).toBeInTheDocument();
    expect(screen.getByText("Agronomy Consultation")).toBeInTheDocument();
    expect(screen.getByText("Seed Cleaning")).toBeInTheDocument();

    // Verify route Link renders View details text
    expect(screen.getByText("View all branches & compare prices")).toBeInTheDocument();
  });
});
