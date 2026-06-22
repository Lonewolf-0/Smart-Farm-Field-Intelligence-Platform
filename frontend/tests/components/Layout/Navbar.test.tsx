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
    const mapLinks = screen.getAllByRole("link", { name: /map/i });
    expect(mapLinks.length).toBeGreaterThan(0);

    const dashboardLinks = screen.getAllByRole("link", { name: /dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThan(0);

    const branchesLinks = screen.getAllByRole("link", { name: /branches/i });
    expect(branchesLinks.length).toBeGreaterThan(0);

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
    expect(screen.getByText("Test User")).toBeInTheDocument();

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

  it("should toggle mobile menu when menu button is clicked", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // By default, the mobile menu is closed, but since we are using CSS `hidden md:flex`,
    // the elements are in the DOM. However, the extra <div> for the open mobile menu
    // is conditionally rendered using `{open && (...)}`

    // Find the menu toggle button. It's the only button without text (it just has an icon)
    // when unauthenticated, or we can find it by looking at surrounding elements.
    // Let's use `aria-expanded` attribute since it's present.
    const toggleBtn = screen.getByRole("button", { expanded: false });
    expect(toggleBtn).toBeInTheDocument();

    // Initially, there should be one set of navigation links (desktop)
    expect(screen.getAllByRole("link", { name: /login/i })).toHaveLength(1);

    // Click to open
    await userEvent.click(toggleBtn);

    // Now aria-expanded should be true
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();

    // Now there should be two sets of navigation links (desktop + mobile)
    expect(screen.getAllByRole("link", { name: /login/i })).toHaveLength(2);

    // Click again to close
    await userEvent.click(screen.getByRole("button", { expanded: true }));

    // Now aria-expanded should be false again
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
  });

  it("should close mobile menu when a navigation item is clicked", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole("button", { expanded: false });

    // Click to open
    await userEvent.click(toggleBtn);
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();

    // Find a mobile link. The mobile links are rendered second, so let's get the last one.
    const loginLinks = screen.getAllByRole("link", { name: /login/i });
    const mobileLoginLink = loginLinks[loginLinks.length - 1];

    // Click the mobile link
    await userEvent.click(mobileLoginLink);

    // The menu should be closed
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
  });
});
