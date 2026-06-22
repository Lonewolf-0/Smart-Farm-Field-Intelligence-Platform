import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AlertBanner from "../../../src/components/UI/AlertBanner";

describe("AlertBanner Component", () => {
  it("renders correctly with a danger type", () => {
    const handleDismiss = vi.fn();
    render(<AlertBanner type="danger" message="Critical error" onDismiss={handleDismiss} />);

    // Check message
    expect(screen.getByText("Critical error")).toBeInTheDocument();

    // Check classes for danger
    const container = screen.getByText("Critical error").closest("div")?.parentElement;
    expect(container).toHaveClass("bg-red-500/20");
    expect(container).toHaveClass("border-red-500/30");
    expect(container).toHaveClass("text-red-200");
  });

  it("renders correctly with a warning type", () => {
    const handleDismiss = vi.fn();
    render(<AlertBanner type="warning" message="Just a warning" onDismiss={handleDismiss} />);

    // Check message
    expect(screen.getByText("Just a warning")).toBeInTheDocument();

    // Check classes for warning
    const container = screen.getByText("Just a warning").closest("div")?.parentElement;
    expect(container).toHaveClass("bg-amber-500/15");
    expect(container).toHaveClass("border-amber-500/25");
    expect(container).toHaveClass("text-amber-200");
  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const handleDismiss = vi.fn();
    render(<AlertBanner type="warning" message="Click to dismiss" onDismiss={handleDismiss} />);

    const dismissButton = screen.getByRole("button", { name: "Dismiss alert" });
    fireEvent.click(dismissButton);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
