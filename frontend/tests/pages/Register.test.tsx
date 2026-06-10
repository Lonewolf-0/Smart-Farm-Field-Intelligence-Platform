import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import Register from "../../src/pages/Register";
import { registerUser } from "../../src/services/authService";

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
  registerUser: vi.fn(),
}));

describe("Register Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    localStorage.clear();
  });

  it("should render registration fields and create account button", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("John Doe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText("••••••••")).toHaveLength(2); // Password and Confirm Password
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("should validate and show errors when name is empty or too short", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("John Doe");

    // Test name too short
    await userEvent.type(nameInput, "a");
    fireEvent.blur(nameInput);
    expect(await screen.findByText("Name must be at least 2 characters.")).toBeInTheDocument();

    // Test name empty
    await userEvent.clear(nameInput);
    fireEvent.blur(nameInput);
    expect(await screen.findByText("Name is required.")).toBeInTheDocument();
  });

  it("should validate and show error when email format is invalid", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("you@example.com");

    await userEvent.type(emailInput, "not-an-email");
    fireEvent.blur(emailInput);
    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
  });

  it("should calculate password strength when password is typed", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];

    // Weak password
    await userEvent.type(passwordInput, "123");
    expect(await screen.findByText("Password strength: Weak")).toBeInTheDocument();

    // Stronger password
    await userEvent.type(passwordInput, "Aa1!bcdefg");
    expect(await screen.findByText(/Password strength: (Good|Strong)/)).toBeInTheDocument();
  });

  it("should show mismatch warning when confirm password doesn't match", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    const confirmInput = screen.getAllByPlaceholderText("••••••••")[1];

    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmInput, "password456");
    fireEvent.blur(confirmInput);

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("should show success checkmark when passwords match", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    const confirmInput = screen.getAllByPlaceholderText("••••••••")[1];

    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmInput, "password123");

    expect(await screen.findByText("Passwords match ✓")).toBeInTheDocument();
  });

  it("should call registerUser API, store token, and navigate on success", async () => {
    vi.mocked(registerUser).mockResolvedValueOnce({ token: "fake-jwt-token" });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("John Doe");
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    const confirmInput = screen.getAllByPlaceholderText("••••••••")[1];
    const submitBtn = screen.getByRole("button", { name: /create account/i });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "john@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmInput, "password123");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
      expect(localStorage.getItem("token")).toBe("fake-jwt-token");
      expect(mockRefreshUser).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/map");
    });
  });

  it("should display server error message when API call fails", async () => {
    vi.mocked(registerUser).mockRejectedValueOnce({
      response: {
        data: {
          error: "Email already exists.",
        },
      },
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const nameInput = screen.getByPlaceholderText("John Doe");
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getAllByPlaceholderText("••••••••")[0];
    const confirmInput = screen.getAllByPlaceholderText("••••••••")[1];
    const submitBtn = screen.getByRole("button", { name: /create account/i });

    await userEvent.type(nameInput, "John Doe");
    await userEvent.type(emailInput, "dup@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.type(confirmInput, "password123");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Email already exists.")).toBeInTheDocument();
    });
  });

  it("should redirect user to /map if already authenticated", () => {
    mockIsAuthenticated = true;
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/map");
  });
});
