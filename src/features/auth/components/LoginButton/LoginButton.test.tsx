import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginButton } from "./LoginButton";

describe("LoginButton", () => {
  it("renders login button with icon", () => {
    const mockOnClick = vi.fn();
    render(<LoginButton onClick={mockOnClick} />);

    const button = screen.getByRole("button", { name: "ログイン" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
  });

  it("calls onClick when clicked", () => {
    const mockOnClick = vi.fn();
    render(<LoginButton onClick={mockOnClick} />);

    const button = screen.getByRole("button", { name: "ログイン" });
    button.click();

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("has correct accessibility attributes", () => {
    const mockOnClick = vi.fn();
    render(<LoginButton onClick={mockOnClick} />);

    const button = screen.getByRole("button", { name: "ログイン" });
    expect(button).toHaveAttribute("title", "ログイン");
  });
});
