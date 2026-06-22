import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Toast from "../../../src/components/UI/Toast";
import React from "react";

describe("Toast Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders the message correctly", () => {
    const message = "Test Toast Message";
    const onClose = vi.fn();
    render(<Toast message={message} onClose={onClose} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("applies the correct styling for 'info' type by default", () => {
    const message = "Info Message";
    const onClose = vi.fn();
    const { container } = render(<Toast message={message} onClose={onClose} />);

    const toastDiv = container.firstChild as HTMLElement;
    expect(toastDiv.className).toContain("border-emerald-500/20");
    expect(toastDiv.className).toContain("bg-slate-900/90");
    expect(toastDiv.className).toContain("text-emerald-100");
  });

  it("applies the correct styling for 'success' type", () => {
    const message = "Success Message";
    const onClose = vi.fn();
    const { container } = render(<Toast message={message} type="success" onClose={onClose} />);

    const toastDiv = container.firstChild as HTMLElement;
    expect(toastDiv.className).toContain("border-green-500/20");
    expect(toastDiv.className).toContain("bg-slate-900/90");
    expect(toastDiv.className).toContain("text-green-100");
  });

  it("applies the correct styling for 'warning' type", () => {
    const message = "Warning Message";
    const onClose = vi.fn();
    const { container } = render(<Toast message={message} type="warning" onClose={onClose} />);

    const toastDiv = container.firstChild as HTMLElement;
    expect(toastDiv.className).toContain("border-amber-500/20");
    expect(toastDiv.className).toContain("bg-slate-900/90");
    expect(toastDiv.className).toContain("text-amber-100");
  });

  it("applies the correct styling for 'error' type", () => {
    const message = "Error Message";
    const onClose = vi.fn();
    const { container } = render(<Toast message={message} type="error" onClose={onClose} />);

    const toastDiv = container.firstChild as HTMLElement;
    expect(toastDiv.className).toContain("border-red-500/20");
    expect(toastDiv.className).toContain("bg-slate-900/90");
    expect(toastDiv.className).toContain("text-red-100");
  });

  it("calls onClose when the close button is clicked", () => {
    const message = "Close Message";
    const onClose = vi.fn();
    render(<Toast message={message} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: /close toast/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose automatically after the default duration (3000ms)", () => {
    const message = "Timeout Message";
    const onClose = vi.fn();
    render(<Toast message={message} onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose automatically after a custom duration", () => {
    const message = "Custom Timeout Message";
    const onClose = vi.fn();
    const customDuration = 5000;
    render(<Toast message={message} onClose={onClose} duration={customDuration} />);

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClose).not.toHaveBeenCalled(); // Should not have been called yet

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears timeout on unmount", () => {
    const message = "Unmount Message";
    const onClose = vi.fn();
    const { unmount } = render(<Toast message={message} onClose={onClose} />);

    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // onClose shouldn't be called if component unmounted before timeout
    expect(onClose).not.toHaveBeenCalled();
  });
});
