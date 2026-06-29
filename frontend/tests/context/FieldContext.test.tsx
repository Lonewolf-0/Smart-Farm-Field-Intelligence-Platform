import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FieldProvider, useField } from '../../src/context/FieldContext';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import userEvent from '@testing-library/user-event';

// Mock API
vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock AuthContext
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

// Test component to consume context
const TestComponent = () => {
  const {
    fields,
    isLoadingFields,
    selectedFieldId,
    setSelectedFieldId,
    refreshFields,
  } = useField();

  return (
    <div>
      <div data-testid="isLoadingFields">{isLoadingFields ? 'yes' : 'no'}</div>
      <div data-testid="selectedFieldId">{selectedFieldId || 'none'}</div>
      <div data-testid="fieldsCount">{fields.length}</div>
      <button onClick={() => setSelectedFieldId('new-id')}>Set Field new-id</button>
      <button onClick={() => setSelectedFieldId(null)}>Clear Field</button>
      <button onClick={() => refreshFields()}>Refresh</button>
      <ul data-testid="fieldsList">
        {fields.map(f => (
          <li key={f.id}>{f.name}</li>
        ))}
      </ul>
    </div>
  );
};

describe('FieldContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws error when useField is used outside of FieldProvider', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn(); // Suppress expected error log

    expect(() => render(<TestComponent />)).toThrow('useField must be used within a FieldProvider');

    console.error = originalConsoleError;
  });

  it('provides default values initially when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('yes');
    expect(screen.getByTestId('selectedFieldId')).toHaveTextContent('none');
    expect(screen.getByTestId('fieldsCount')).toHaveTextContent('0');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('fetches fields and sets first field as selected when authenticated', async () => {
    const mockFields = [
      { id: 'field-1', name: 'Field 1' },
      { id: 'field-2', name: 'Field 2' },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: mockFields },
    });

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    // Initial loading state
    expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('yes');

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('no');
    });

    expect(screen.getByTestId('fieldsCount')).toHaveTextContent('2');
    expect(screen.getByTestId('selectedFieldId')).toHaveTextContent('field-1');
    expect(localStorage.getItem('selectedFieldId')).toBe('field-1');
    expect(api.get).toHaveBeenCalledWith('/fields');
  });

  it('fetches fields and retains selectedFieldId from localStorage if valid', async () => {
    localStorage.setItem('selectedFieldId', 'field-2');

    const mockFields = [
      { id: 'field-1', name: 'Field 1' },
      { id: 'field-2', name: 'Field 2' },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: mockFields },
    });

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('no');
    });

    expect(screen.getByTestId('selectedFieldId')).toHaveTextContent('field-2');
    expect(localStorage.getItem('selectedFieldId')).toBe('field-2');
  });

  it('fetches fields but ignores selectedFieldId from localStorage if invalid', async () => {
    localStorage.setItem('selectedFieldId', 'invalid-field');

    const mockFields = [
      { id: 'field-1', name: 'Field 1' },
      { id: 'field-2', name: 'Field 2' },
    ];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: mockFields },
    });

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('no');
    });

    // Should fall back to the first field
    expect(screen.getByTestId('selectedFieldId')).toHaveTextContent('field-1');
    expect(localStorage.getItem('selectedFieldId')).toBe('field-1');
  });

  it('sets selectedFieldId to null if fields are empty', async () => {
    localStorage.setItem('selectedFieldId', 'field-1');

    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('no');
    });

    // Should be set to null
    expect(screen.getByTestId('selectedFieldId')).toHaveTextContent('none');
    expect(localStorage.getItem('selectedFieldId')).toBeNull();
  });

  it('setSelectedFieldId updates state and localStorage correctly', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('no');
    });

    const setButton = screen.getByText('Set Field new-id');
    await userEvent.click(setButton);

    expect(screen.getByTestId('selectedFieldId')).toHaveTextContent('new-id');
    expect(localStorage.getItem('selectedFieldId')).toBe('new-id');
  });

  it('setSelectedFieldId with null removes from localStorage', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('no');
    });

    const setButton = screen.getByText('Set Field new-id');
    await userEvent.click(setButton);
    expect(localStorage.getItem('selectedFieldId')).toBe('new-id');

    const clearButton = screen.getByText('Clear Field');
    await userEvent.click(clearButton);

    expect(screen.getByTestId('selectedFieldId')).toHaveTextContent('none');
    expect(localStorage.getItem('selectedFieldId')).toBeNull();
  });

  it('handles api fetch error gracefully', async () => {
    const originalConsoleError = console.error;
    console.error = vi.fn(); // Suppress expected error log

    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('no');
    });

    expect(screen.getByTestId('fieldsCount')).toHaveTextContent('0');
    expect(console.error).toHaveBeenCalledWith('Failed to fetch fields:', expect.any(Error));

    console.error = originalConsoleError;
  });

  it('refreshFields can be triggered manually', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    render(
      <FieldProvider>
        <TestComponent />
      </FieldProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoadingFields')).toHaveTextContent('no');
    });

    // First call happens automatically on mount
    expect(api.get).toHaveBeenCalledTimes(1);

    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { success: true, data: [{ id: 'field-1', name: 'Field 1' }] },
    });

    const refreshButton = screen.getByText('Refresh');
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId('fieldsCount')).toHaveTextContent('1');
    });

    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
