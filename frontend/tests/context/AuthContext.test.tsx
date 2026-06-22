import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import api from '../../src/services/api';
import userEvent from '@testing-library/user-event';

// Mock api
vi.mock('../../src/services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// A test component to consume AuthContext
const TestComponent = () => {
  const { user, token, isAuthenticated, isLoading, login, refreshUser, logout } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'no user'}</div>
      <div data-testid="token">{token || 'no token'}</div>
      <div data-testid="isAuthenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="isLoading">{isLoading ? 'yes' : 'no'}</div>
      <button onClick={() => login('new-token', { id: '2', name: 'New User', email: 'test@test.com', role: 'user', _id: '2' } as any)}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshUser}>Refresh</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly without token', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Without token, refreshUser completes quickly and unsets everything
    expect(await screen.findByTestId('user')).toHaveTextContent('no user');
    expect(screen.getByTestId('token')).toHaveTextContent('no token');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('no');
    // Once it renders children, isLoading is false in the provider state we receive
    expect(screen.getByTestId('isLoading')).toHaveTextContent('no');
  });

  it('fetches user correctly if token exists', async () => {
    localStorage.setItem('token', 'existing-token');

    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { data: { id: '1', name: 'Test User' } },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial render might be loading (Loading... text inside AuthProvider)
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // After loading completes
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    expect(screen.getByTestId('token')).toHaveTextContent('existing-token');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('yes');
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('handles api fetch error by clearing user and token', async () => {
    localStorage.setItem('token', 'invalid-token');

    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Invalid token'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    expect(screen.getByTestId('token')).toHaveTextContent('no token');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('no');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('login function sets token, user and navigates', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    expect(screen.getByTestId('user')).toHaveTextContent('New User');
    expect(screen.getByTestId('token')).toHaveTextContent('new-token');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('yes');
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('logout function clears token, user and navigates', async () => {
    localStorage.setItem('token', 'existing-token');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { data: { id: '1', name: 'Test User' } },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    const logoutButton = screen.getByText('Logout');
    await userEvent.click(logoutButton);

    expect(screen.getByTestId('user')).toHaveTextContent('no user');
    expect(screen.getByTestId('token')).toHaveTextContent('no token');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('no');
    expect(localStorage.getItem('token')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('listens for storage events and refreshes user', async () => {
    // We render without a token first
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    // Simulate another tab setting a token
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { data: { id: '3', name: 'Storage User' } },
    });

    localStorage.setItem('token', 'storage-token');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'token',
        newValue: 'storage-token'
      }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Storage User');
    });

    expect(screen.getByTestId('token')).toHaveTextContent('storage-token');
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('throws error when useAuth is used outside of AuthProvider', () => {
    const originalConsoleError = console.error;
    console.error = vi.fn(); // Suppress expected error log

    expect(() => render(<TestComponent />)).toThrow('useAuth must be used within AuthProvider');

    console.error = originalConsoleError;
  });
});
