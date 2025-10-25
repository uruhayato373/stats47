import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { describe, expect, it, vi } from "vitest";

import { HeaderAuthSection } from "./HeaderAuthSection";

// next-auth/reactをモック
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

// useAuthModalをモック
vi.mock("@/hooks/useAuthModal", () => ({
  useAuthModal: vi.fn(() => ({
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
  })),
}));

const mockUseSession = vi.mocked(useSession);

describe("HeaderAuthSection", () => {
  it("shows login button when not authenticated", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<HeaderAuthSection />);

    expect(
      screen.getByRole("button", { name: "ログイン" })
    ).toBeInTheDocument();
  });

  it("shows user menu when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          username: "testuser",
          name: "テストユーザー",
          email: "test@example.com",
          role: "user",
        },
      },
      status: "authenticated",
    });

    render(<HeaderAuthSection />);

    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
    });

    render(<HeaderAuthSection />);

    // ローディング中はログインボタンを表示
    expect(
      screen.getByRole("button", { name: "ログイン" })
    ).toBeInTheDocument();
  });
});
