import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AnalysisProvider, useAnalysisContext } from '../../src/context/AnalysisContext';

// A test component that consumes the AnalysisContext
const TestComponent = () => {
  const context = useAnalysisContext();
  return (
    <div>
      <span data-testid="is-loading">{context.isLoading.toString()}</span>
      <span data-testid="has-cached-data">{context.hasCachedData.toString()}</span>
      <span data-testid="is-stale-24h">{context.isStale24h.toString()}</span>
      <span data-testid="is-stale-7d">{context.isStale7d.toString()}</span>
      <button onClick={() => context.refreshAnalysis()}>Refresh</button>
    </div>
  );
};

describe('AnalysisContext', () => {
  it('throws an error if useAnalysisContext is used outside of AnalysisProvider', () => {
    // Suppress console.error for the expected error
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useAnalysisContext must be used within an AnalysisProvider'
    );

    consoleError.mockRestore();
  });

  it('provides the correct context values to its children', async () => {
    const user = userEvent.setup();
    const mockRefreshAnalysis = vi.fn().mockResolvedValue(undefined);

    // Note: AnalysisProvider is a pure context provider in this application,
    // state is managed externally (e.g. in DashboardPage.tsx).
    const mockContextValue = {
      data: { soil: { type: 'loam' } },
      timestamp: 1234567890,
      isLoading: false,
      isStale24h: false,
      isStale7d: false,
      refreshAnalysis: mockRefreshAnalysis,
      hasCachedData: true,
    };

    render(
      <AnalysisProvider value={mockContextValue}>
        <TestComponent />
      </AnalysisProvider>
    );

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('has-cached-data')).toHaveTextContent('true');
    expect(screen.getByTestId('is-stale-24h')).toHaveTextContent('false');
    expect(screen.getByTestId('is-stale-7d')).toHaveTextContent('false');

    // Test calling the function with userEvent
    const button = screen.getByText('Refresh');
    await user.click(button);
    expect(mockRefreshAnalysis).toHaveBeenCalledTimes(1);
  });
});
