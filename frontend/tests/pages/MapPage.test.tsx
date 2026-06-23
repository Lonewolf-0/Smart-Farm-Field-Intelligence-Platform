import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import MapPage from "../../src/pages/MapPage";
import { useAuth } from "../../src/context/AuthContext";
import { useField } from "../../src/context/FieldContext";
import api from "../../src/services/api";
import * as turf from "@turf/turf";

// Mock dependencies
vi.mock("../../src/context/AuthContext");
vi.mock("../../src/context/FieldContext");
vi.mock("../../src/services/api");

// Mock turf
vi.mock("@turf/turf", () => ({
  area: vi.fn(() => 10000),
  polygon: vi.fn((coords) => ({ type: 'Polygon', coordinates: coords })),
}));

// Mock child components
vi.mock("../../src/components/Map/FarmMap", () => ({
  default: ({ onPolygonChange, savedFields, selectedFieldId, onSelectField }: any) => (
    <div data-testid="farm-map">
      <button
        data-testid="mock-polygon-change"
        onClick={() => onPolygonChange({
          geoJSON: {
            type: "Polygon",
            coordinates: [[[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]]] // Simple 100x100 square
          }
        })}
      >
        Mock Draw Polygon
      </button>
      <button data-testid="mock-polygon-clear" onClick={() => onPolygonChange(null)}>
        Mock Clear Polygon
      </button>
    </div>
  ),
}));

vi.mock("../../src/components/Map/FieldSidebar", () => ({
  default: ({ fields, isLoading, selectedFieldId, onSelectField, onDeleteField, onEditField }: any) => (
    <div data-testid="field-sidebar">
      <button data-testid="mock-delete-field" onClick={() => onDeleteField("field-1")}>Delete Field</button>
      <button data-testid="mock-edit-field" onClick={() => onEditField("field-1", "New Name")}>Edit Field</button>
      <button data-testid="mock-select-field" onClick={() => onSelectField("field-1")}>Select Field</button>
    </div>
  ),
}));

vi.mock("../../src/components/Map/SaveFieldModal", () => ({
  default: ({ isOpen, isLoading, onSave, onCancel, areaHectares }: any) => isOpen ? (
    <div data-testid="save-field-modal">
      <span data-testid="modal-area">{areaHectares}</span>
      <button data-testid="modal-save" onClick={() => onSave("Test Field Name")}>Save</button>
      <button data-testid="modal-cancel" onClick={onCancel}>Cancel</button>
    </div>
  ) : null,
}));

// Setup default mocks
const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockUseField = useField as unknown as ReturnType<typeof vi.fn>;
const mockApiPost = api.post as unknown as ReturnType<typeof vi.fn>;
const mockApiDelete = api.delete as unknown as ReturnType<typeof vi.fn>;
const mockApiPut = api.put as unknown as ReturnType<typeof vi.fn>;

describe("MapPage", () => {
  const mockRefreshFields = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default to authenticated state
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    // Default to a basic field context
    mockUseField.mockReturnValue({
      fields: [],
      isLoadingFields: false,
      selectedFieldId: null,
      setSelectedFieldId: vi.fn(),
      refreshFields: mockRefreshFields,
    });

    // Prevent window.alert from failing tests
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the sidebar and map when authenticated", () => {
    render(<MapPage />);

    expect(screen.getByTestId("field-sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("farm-map")).toBeInTheDocument();
    expect(screen.queryByText("Save Polygon")).not.toBeInTheDocument(); // Shouldn't show until polygon drawn
  });

  it("does not render the sidebar when unauthenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    render(<MapPage />);

    expect(screen.queryByTestId("field-sidebar")).not.toBeInTheDocument();
    expect(screen.getByTestId("farm-map")).toBeInTheDocument();
  });

  it("calculates area and shows save button when polygon is drawn", async () => {
    render(<MapPage />);

    // Initial state: no drawn polygon
    expect(screen.queryByText("Save Polygon")).not.toBeInTheDocument();
    expect(screen.queryByText("Drawn Field Data")).not.toBeInTheDocument();

    // Trigger polygon draw
    fireEvent.click(screen.getByTestId("mock-polygon-change"));

    // Verify area calculation and UI update
    await waitFor(() => {
      expect(screen.getByText("Save Polygon")).toBeInTheDocument();
      expect(screen.getByText("Drawn Field Data")).toBeInTheDocument();
      expect(screen.getByText(/1\.00 ha/)).toBeInTheDocument(); // 10000 sq m / 10000 = 1 ha
    });
  });

  it("handles saving a field successfully", async () => {
    mockApiPost.mockResolvedValueOnce({ data: { id: "new-field", name: "Test Field Name" } });

    render(<MapPage />);

    // Draw polygon
    fireEvent.click(screen.getByTestId("mock-polygon-change"));

    // Click save button
    fireEvent.click(await screen.findByText("Save Polygon"));

    // Wait for modal and click save inside modal
    expect(await screen.findByTestId("save-field-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("modal-save"));

    // Verify API call
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/fields", {
        name: "Test Field Name",
        polygon: {
          type: "Polygon",
          coordinates: [[[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]]]
        }
      });
      // Verify success message
      expect(screen.getByText('Field "Test Field Name" saved successfully!')).toBeInTheDocument();
      // Verify refresh was called
      expect(mockRefreshFields).toHaveBeenCalled();
    });
  });

  it("handles deleting a field successfully", async () => {
    mockApiDelete.mockResolvedValueOnce({});

    render(<MapPage />);

    fireEvent.click(screen.getByTestId("mock-delete-field"));

    await waitFor(() => {
      expect(mockApiDelete).toHaveBeenCalledWith("/fields/field-1");
      expect(mockRefreshFields).toHaveBeenCalled();
    });
  });

  it("handles editing a field successfully", async () => {
    mockApiPut.mockResolvedValueOnce({});

    render(<MapPage />);

    fireEvent.click(screen.getByTestId("mock-edit-field"));

    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith("/fields/field-1", { name: "New Name" });
      expect(mockRefreshFields).toHaveBeenCalled();
    });
  });

  it("handles selecting a field", () => {
    const mockSetSelectedFieldId = vi.fn();
    mockUseField.mockReturnValue({
      fields: [],
      isLoadingFields: false,
      selectedFieldId: null,
      setSelectedFieldId: mockSetSelectedFieldId,
      refreshFields: mockRefreshFields,
    });

    render(<MapPage />);

    fireEvent.click(screen.getByTestId("mock-select-field"));

    expect(mockSetSelectedFieldId).toHaveBeenCalled();
  });

});
