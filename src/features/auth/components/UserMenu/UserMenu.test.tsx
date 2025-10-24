import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "./UserMenu";

// next-auth/reactをモック
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("UserMenu", () => {
  it("renders user menu with user information", () => {
    const user = {
      username: "testuser",
      name: "テストユーザー",
      email: "test@example.com",
      role: "user",
    };

    render(<UserMenu user={user} />);

    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows admin badge for admin users", () => {
    const user = {
      username: "admin",
      name: "管理者",
      email: "admin@example.com",
      role: "admin",
    };

    render(<UserMenu user={user} />);

    expect(screen.getByText("管理者")).toBeInTheDocument();
  });

  it("shows admin menu item for admin users", () => {
    const user = {
      username: "admin",
      name: "管理者",
      email: "admin@example.com",
      role: "admin",
    };

    render(<UserMenu user={user} />);

    // ドロップダウンメニューを開く
    const trigger = screen.getByRole("button");
    trigger.click();

    expect(screen.getByText("管理画面")).toBeInTheDocument();
  });

  it("does not show admin menu item for regular users", () => {
    const user = {
      username: "testuser",
      name: "テストユーザー",
      email: "test@example.com",
      role: "user",
    };

    render(<UserMenu user={user} />);

    // ドロップダウンメニューを開く
    const trigger = screen.getByRole("button");
    trigger.click();

    expect(screen.queryByText("管理画面")).not.toBeInTheDocument();
  });

  it("uses name when username is not available", () => {
    const user = {
      name: "名前のみユーザー",
      email: "nameonly@example.com",
      role: "user",
    };

    render(<UserMenu user={user} />);

    expect(screen.getByText("名前のみユーザー")).toBeInTheDocument();
  });
});
