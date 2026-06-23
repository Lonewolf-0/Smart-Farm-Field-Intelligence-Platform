import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FarmMap from "../FarmMap";

// Mock react-leaflet
vi.mock("react-leaflet", async () => {
  const actual = await vi.importActual("react-leaflet");
  return {
    ...actual,
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    GeoJSON: ({ children, "data-testid": testId, eventHandlers }: any) => (
      <div
        data-testid={testId || "geojson"}
        onClick={eventHandlers?.click}
      >
        {children}
      </div>
    ),
    Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
    Marker: ({ eventHandlers }: any) => <div data-testid="marker" onClick={eventHandlers?.click} />,
    useMap: () => ({
      flyTo: vi.fn(),
    }),
  };
});

// Mock Leaflet
vi.mock("leaflet", () => {
  return {
    default: {
      divIcon: vi.fn(),
    },
  };
});

// Mock GeomanControl
vi.mock("../GeomanControl", () => ({
  default: ({ onPolygonCreated, onPolygonDeleted }: any) => (
    <div data-testid="geoman-control">
      <button onClick={() => onPolygonCreated({ type: "Polygon", coordinates: [] })}>Create</button>
      <button onClick={() => onPolygonDeleted()}>Delete</button>
    </div>
  ),
}));

describe("FarmMap", () => {
  let mockGeolocation: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup geolocation mock
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
    };
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });

    // Mock fetch for search
    global.fetch = vi.fn();

    // Mock Element.scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders correctly with default state", () => {
    render(<FarmMap />);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search location...")).toBeInTheDocument();
    expect(screen.getByTestId("geoman-control")).toBeInTheDocument();
  });

  it("handles geolocation loading and success", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success: any) => {
      // Don't call immediately to test loading state
      setTimeout(() => {
        success({
          coords: { latitude: 10, longitude: 20 },
        });
      }, 50);
    });

    render(<FarmMap />);
    expect(screen.getByText("Detecting your location...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Detecting your location...")).not.toBeInTheDocument();
    });

    // Check recenter button is available after location granted
    expect(screen.getByTitle("Center on my location")).toBeInTheDocument();
  });

  it("recenters map when clicking recenter button", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success: any) => {
      success({
        coords: { latitude: 10, longitude: 20 },
      });
    });

    render(<FarmMap />);

    await waitFor(() => {
      expect(screen.getByTitle("Center on my location")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle("Center on my location"));
    // We mock flyTo internally, so we don't assert it here directly,
    // but we check the interaction works without crashing
  });

  it("handles geolocation denial", async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success: any, error: any) => {
      error({ code: 1, message: "Denied" });
    });

    render(<FarmMap />);

    await waitFor(() => {
      expect(screen.getByText("📍 Location access denied. Showing default view.")).toBeInTheDocument();
    });
  });

  it("renders saved fields and handles selection", () => {
    const savedFields = [
      { id: "1", name: "Field 1", polygon: { type: "Polygon", coordinates: [] }, centroid: { lat: 10, lng: 20 } },
      { id: "2", name: "Field 2", polygon: { type: "Polygon", coordinates: [] }, centroid: { lat: 30, lng: 40 } },
    ];

    const handleSelectField = vi.fn();

    render(<FarmMap savedFields={savedFields} selectedFieldId="1" onSelectField={handleSelectField} />);

    const fields = screen.getAllByTestId("geojson");
    expect(fields).toHaveLength(2);
    expect(screen.getByText("Field 1")).toBeInTheDocument();
    expect(screen.getByText("Field 2")).toBeInTheDocument();

    fireEvent.click(fields[0]);
    expect(handleSelectField).toHaveBeenCalledWith("1");
  });

  it("performs search and displays results", async () => {
    const mockResponse = {
      features: [
        {
          properties: { name: "Test Location", country: "Test Country", osm_id: "123" },
          geometry: { coordinates: [20, 10] },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const user = userEvent.setup();
    render(<FarmMap />);

    const searchInput = screen.getByPlaceholderText("Search location...");
    await user.type(searchInput, "Test");

    // Wait for debounced search
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("Test"));
    });

    await waitFor(() => {
      expect(screen.getByText("Test Location, Test Country")).toBeInTheDocument();
    });
  });

  it("handles search errors", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const user = userEvent.setup();
    render(<FarmMap />);

    const searchInput = screen.getByPlaceholderText("Search location...");
    await user.type(searchInput, "Test");

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    // Check that an error is not explicitly rendered on screen if catch block handles it silently,
    // or if handled, just that it completes
  });

  it("handles form submit for search", async () => {
    const mockResponse = {
      features: [
        {
          properties: { name: "Test Submit Location", country: "Test Country", osm_id: "456" },
          geometry: { coordinates: [20, 10] },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const user = userEvent.setup();
    render(<FarmMap />);

    const searchInput = screen.getByPlaceholderText("Search location...");
    await user.type(searchInput, "TestSubmit");

    const submitBtn = screen.getByText("Search");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Check if the searched location is set (input value updates)
    await waitFor(() => {
      expect(searchInput).toHaveValue("Test Submit Location, Test Country");
    });

    // Check marker is rendered
    expect(screen.getByTestId("marker")).toBeInTheDocument();

    // Click marker
    fireEvent.click(screen.getByTestId("marker"));
  });

  it("handles form submit when no results found", async () => {
    const mockResponse = {
      features: [],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const user = userEvent.setup();
    render(<FarmMap />);

    const searchInput = screen.getByPlaceholderText("Search location...");
    await user.type(searchInput, "TestSubmitEmpty");

    const submitBtn = screen.getByText("Search");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("No locations found")).toBeInTheDocument();
    });
  });

  it("clears search input", async () => {
    const user = userEvent.setup();
    render(<FarmMap />);

    const searchInput = screen.getByPlaceholderText("Search location...");
    await user.type(searchInput, "Test");

    // Wait for the clear button to appear
    const clearBtn = await screen.findByRole("button", { name: "" }); // the X icon button
    await user.click(clearBtn);

    expect(searchInput).toHaveValue("");
  });

  it("handles keyboard navigation in search results", async () => {
    const mockResponse = {
      features: [
        {
          properties: { name: "Result 1", osm_id: "1" },
          geometry: { coordinates: [20, 10] },
        },
        {
          properties: { name: "Result 2", osm_id: "2" },
          geometry: { coordinates: [21, 11] },
        },
      ],
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const user = userEvent.setup();
    render(<FarmMap />);

    const searchInput = screen.getByPlaceholderText("Search location...");
    await user.type(searchInput, "Result");

    await waitFor(() => {
      expect(screen.getByText("Result 1")).toBeInTheDocument();
      expect(screen.getByText("Result 2")).toBeInTheDocument();
    });

    // Arrow down
    await user.keyboard("{ArrowDown}");

    // Arrow down again
    await user.keyboard("{ArrowDown}");

    // Arrow up
    await user.keyboard("{ArrowUp}");

    // Enter to select
    await user.keyboard("{Enter}");

    // Verify selection (input should contain selected text)
    await waitFor(() => {
      expect(searchInput).toHaveValue("Result 1");
    });
  });

  it("handles keyboard Escape to close results", async () => {
    const mockResponse = {
      features: [
        {
          properties: { name: "Result 1", osm_id: "1" },
          geometry: { coordinates: [20, 10] },
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const user = userEvent.setup();
    render(<FarmMap />);

    const searchInput = screen.getByPlaceholderText("Search location...");
    await user.type(searchInput, "Result");

    await waitFor(() => {
      expect(screen.getByText("Result 1")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("Result 1")).not.toBeInTheDocument();
    });
  });

  it("handles polygon creation and deletion from GeomanControl", () => {
    const handlePolygonChange = vi.fn();
    render(<FarmMap onPolygonChange={handlePolygonChange} />);

    const createBtn = screen.getByText("Create");
    const deleteBtn = screen.getByText("Delete");

    fireEvent.click(createBtn);
    expect(handlePolygonChange).toHaveBeenCalledWith({ geoJSON: { type: "Polygon", coordinates: [] } });

    fireEvent.click(deleteBtn);
    expect(handlePolygonChange).toHaveBeenCalledWith(null);
  });
});
