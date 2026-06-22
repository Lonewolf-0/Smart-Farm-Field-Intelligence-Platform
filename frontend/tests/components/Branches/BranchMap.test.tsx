import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BranchMap from '../../../src/components/Branches/BranchMap';
import { vi } from 'vitest';

// Mock react-leaflet
vi.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children, eventHandlers }: { children: React.ReactNode, eventHandlers?: any }) => (
      <div data-testid="marker" onClick={eventHandlers?.click}>
        {children}
      </div>
    ),
    Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
    GeoJSON: () => <div data-testid="geojson" />,
    useMap: () => ({
      flyTo: vi.fn(),
    }),
  };
});

describe('BranchMap', () => {
  const mockBranches = [
    {
      id: 'branch1',
      name: 'Test Branch 1',
      address: '123 Test St',
      latitude: 45.0,
      longitude: -90.0,
      phone: '123-456-7890',
      manager: 'John Doe',
      services: ['Service A', 'Service B'],
      distance: 10,
    },
    {
      id: 'branch2',
      name: 'Test Branch 2',
      address: '456 Test Ave',
      latitude: 46.0,
      longitude: -91.0,
      phone: '098-765-4321',
      manager: 'Jane Smith',
      services: ['Service C'],
    },
  ];

  const mockSavedFields = [
    {
      id: 'field1',
      name: 'Test Field 1',
      polygon: { type: 'Polygon', coordinates: [] } as any,
      centroid: { lat: 45.5, lng: -90.5 },
      area: 100,
    },
  ];

  it('renders map with branches and fields', () => {
    render(
      <BranchMap
        branches={mockBranches}
        savedFields={mockSavedFields}
        selectedBranchId={null}
        selectedFieldId="field1"
        onSelectBranch={vi.fn()}
      />
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
    expect(screen.getAllByTestId('marker')).toHaveLength(3); // 2 branches + 1 field centroid
    expect(screen.getAllByTestId('geojson')).toHaveLength(1); // 1 field polygon
  });

  it('calls onSelectBranch when a branch marker is clicked', () => {
    const mockOnSelectBranch = vi.fn();
    render(
      <BranchMap
        branches={mockBranches}
        savedFields={mockSavedFields}
        selectedBranchId={null}
        onSelectBranch={mockOnSelectBranch}
      />
    );

    const markers = screen.getAllByTestId('marker');
    fireEvent.click(markers[0]); // Click branch 1

    expect(mockOnSelectBranch).toHaveBeenCalledWith('branch1');
  });

  it('shows branch details in popup', () => {
    render(
      <BranchMap
        branches={[mockBranches[0]]}
        savedFields={[]}
        selectedBranchId={null}
        onSelectBranch={vi.fn()}
      />
    );

    expect(screen.getByText('Test Branch 1')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText('Service A')).toBeInTheDocument();
    expect(screen.getByText('Service B')).toBeInTheDocument();
    expect(screen.getByText('Distance:')).toBeInTheDocument();
    expect(screen.getByText('6.2 miles')).toBeInTheDocument(); // 10 * 0.621371 = 6.21371
  });

  it('renders field marker popup correctly', () => {
    render(
      <BranchMap
        branches={[]}
        savedFields={mockSavedFields}
        selectedBranchId={null}
        selectedFieldId="field1"
        onSelectBranch={vi.fn()}
      />
    );

    expect(screen.getByText('Test Field 1')).toBeInTheDocument();
    expect(screen.getByText('Your Farm')).toBeInTheDocument();
  });

  it('shows +X more when there are more than 3 services', () => {
    const branchWithManyServices = {
        ...mockBranches[0],
        services: ['S1', 'S2', 'S3', 'S4', 'S5']
    }
    render(
        <BranchMap
            branches={[branchWithManyServices]}
            savedFields={[]}
            selectedBranchId={null}
            onSelectBranch={vi.fn()}
        />
    )

    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.getByText('S2')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
    expect(screen.queryByText('S4')).not.toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  })
});
