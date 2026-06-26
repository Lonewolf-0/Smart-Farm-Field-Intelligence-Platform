import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import Navbar from "../../../src/components/Layout/Navbar";

const mockLogout = vi.fn();
let mockIsAuthenticated = false;
let mockUser: { name: string } | null = null;

// Mock context hook
vi.mock("../../../src/context/AuthContext", () => ({
  useAuth: () => ({
    logout: mockLogout,
    isAuthenticated: mockIsAuthenticated,
    user: mockUser,
  }),
}));

describe("Navbar Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockUser = null;
  });

  it("should render Map, Dashboard, Branches, Login, and Register links when unauthenticated", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Desktop elements
    const loginLinks = screen.getAllByRole("link", { name: /login/i });
    expect(loginLinks.length).toBeGreaterThan(0);

    const registerLinks = screen.getAllByRole("link", { name: /register/i });
    expect(registerLinks.length).toBeGreaterThan(0);

    // Authenticated elements should not be present
    expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
  });

  it("should render user name and Logout button when authenticated", () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Test User" };

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Check user name
    expect(screen.getAllByText("Test User")[0]).toBeInTheDocument();

    // Check Logout button
    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    expect(logoutButtons.length).toBeGreaterThan(0);

    // Unauthenticated elements should not be present
    expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
  });

  it("should call logout function when Logout button is clicked", async () => {
    mockIsAuthenticated = true;
    mockUser = { name: "Test User" };

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Click the desktop logout button (usually the first one rendered if hidden classes are just CSS)
    const logoutButtons = screen.getAllByRole("button", { name: /logout/i });
    await userEvent.click(logoutButtons[0]);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

});
