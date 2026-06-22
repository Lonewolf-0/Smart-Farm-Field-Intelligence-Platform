import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import BranchesPage from "../../src/pages/BranchesPage";
import api from "../../src/services/api";

// Mock child components
vi.mock("../../src/components/Branches/BranchMap", () => ({
  default: () => <div data-testid="branch-map">BranchMap</div>,
}));

vi.mock("../../src/components/Branches/BranchList", () => ({
  default: ({ branches }: any) => (
    <div data-testid="branch-list">
      BranchList - {branches.length} branches
    </div>
  ),
}));

vi.mock("../../src/components/Branches/PriceCompare", () => ({
  default: () => <div data-testid="price-compare">PriceCompare</div>,
}));

vi.mock("../../src/components/UI/CustomSelect", () => ({
  default: ({ onChange }: any) => (
    <select
      data-testid="custom-select"
      onChange={(e) => onChange({ id: e.target.value })}
    >
      <option value="field-1">Field 1</option>
      <option value="field-2">Field 2</option>
    </select>
  ),
}));

const mockBranches = [
  { id: "1", name: "Branch 1" },
  { id: "2", name: "Branch 2" },
];

const mockFields = [
  {
    id: "field-1",
    name: "Field 1",
    centroid: { lat: 10, lng: 20 },
  },
];

let mockIsAuthenticated = true;

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
  }),
}));

let mockFieldsData: any[] = [];
let mockSelectedFieldId: string | null = null;
let mockSetSelectedFieldId = vi.fn();

vi.mock("../../src/context/FieldContext", () => ({
  useField: () => ({
    fields: mockFieldsData,
    selectedFieldId: mockSelectedFieldId,
    setSelectedFieldId: mockSetSelectedFieldId,
    isLoadingFields: false,
  }),
}));

vi.mock("../../src/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("BranchesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockFieldsData = mockFields;
    mockSelectedFieldId = "field-1";
    mockSetSelectedFieldId = vi.fn((id) => {
      mockSelectedFieldId = id;
    });
  });

  it("renders correctly and fetches nearest branches if a field is selected", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockBranches },
    });

    render(<BranchesPage />);

    expect(screen.getByText("Branches Map")).toBeInTheDocument();
    expect(screen.getByTestId("custom-select")).toBeInTheDocument();

    // Verify API call for nearest branches using field centroid
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        `/branches/nearest?lat=10&lng=20&limit=100`
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("branch-list")).toHaveTextContent(
        "BranchList - 2 branches"
      );
    });

    expect(screen.getByTestId("branch-map")).toBeInTheDocument();
  });

  it("fetches all branches if no fields are available", async () => {
    mockFieldsData = [];
    mockSelectedFieldId = null;

    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockBranches },
    });

    render(<BranchesPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/branches");
    });

    await waitFor(() => {
      expect(screen.getByTestId("branch-list")).toHaveTextContent(
        "BranchList - 2 branches"
      );
    });

    expect(screen.queryByTestId("custom-select")).not.toBeInTheDocument();
  });

  it("toggles between Nearby Branches and Compare Prices tabs", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockBranches },
    });

    render(<BranchesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("branch-list")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("price-compare")).not.toBeInTheDocument();

    const compareButton = screen.getByRole("button", {
      name: /Compare Prices/i,
    });
    await userEvent.click(compareButton);

    expect(screen.queryByTestId("branch-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("price-compare")).toBeInTheDocument();

    const nearbyButton = screen.getByRole("button", {
      name: /Nearby Branches/i,
    });
    await userEvent.click(nearbyButton);

    expect(screen.getByTestId("branch-list")).toBeInTheDocument();
    expect(screen.queryByTestId("price-compare")).not.toBeInTheDocument();
  });

  it("calls setSelectedFieldId when field is changed", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { success: true, data: mockBranches },
    });

    render(<BranchesPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const select = screen.getByTestId("custom-select");
    await userEvent.selectOptions(select, "field-2");

    expect(mockSetSelectedFieldId).toHaveBeenCalledWith("field-2");
  });

  it("shows loading state initially", () => {
    // Return a promise that never resolves to keep the loading state
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));

    render(<BranchesPage />);

    // Check for the loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
