import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import Login from "../../src/pages/Login";
import { loginUser } from "../../src/services/authService";

const mockRefreshUser = vi.fn();
let mockIsAuthenticated = false;

// Mock context hook
vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Mock useNavigate hook
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock authService API calls
vi.mock("../../src/services/authService", () => ({
  loginUser: vi.fn(),
}));

describe("Login Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    localStorage.clear();
  });

  it("should render email, password inputs, and submit button", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("should have a disabled login button when inputs are empty", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole("button", { name: /login/i });
    expect(submitBtn).toBeDisabled();
  });

  it("should show validation error on form submit with invalid email format", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /login/i });

    // Inputs not empty enables submit button
    await userEvent.type(emailInput, "invalidemail");
    await userEvent.type(passwordInput, "password123");
    expect(submitBtn).not.toBeDisabled();

    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address.")
      ).toBeInTheDocument();
    });
  });

  it("should call loginUser API, store token, and navigate on success", async () => {
    vi.mocked(loginUser).mockResolvedValueOnce({ token: "fake-jwt-token" });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /login/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("should display server error message when API call fails", async () => {
    vi.mocked(loginUser).mockRejectedValueOnce({
      response: {
        data: {
          error: "Invalid credentials.",
        },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByRole("button", { name: /login/i });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "wrongpassword");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials.")).toBeInTheDocument();
    });
  });

  it("should redirect user to /map if already authenticated", () => {
    mockIsAuthenticated = true;
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
