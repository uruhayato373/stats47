import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";
import { ActiveSidebarMenuButton } from "./ActiveSidebarMenuButton";

// next/navigationをモック
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

const mockUsePathname = vi.mocked(usePathname);

describe("ActiveSidebarMenuButton", () => {
  it("renders with children", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <ActiveSidebarMenuButton href="/admin">
        <span>Admin</span>
      </ActiveSidebarMenuButton>
    );

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("applies active state when pathname matches", () => {
    mockUsePathname.mockReturnValue("/admin");

    const { container } = render(
      <ActiveSidebarMenuButton href="/admin">
        <span>Admin</span>
      </ActiveSidebarMenuButton>
    );

    // isActive=trueが適用されることを確認
    expect(container.querySelector('[data-active="true"]')).toBeInTheDocument();
  });

  it("does not apply active state when pathname does not match", () => {
    mockUsePathname.mockReturnValue("/");

    const { container } = render(
      <ActiveSidebarMenuButton href="/admin">
        <span>Admin</span>
      </ActiveSidebarMenuButton>
    );

    expect(
      container.querySelector('[data-active="true"]')
    ).not.toBeInTheDocument();
  });

  it("applies active state for sub-routes", () => {
    mockUsePathname.mockReturnValue("/admin/users");

    const { container } = render(
      <ActiveSidebarMenuButton href="/admin">
        <span>Admin</span>
      </ActiveSidebarMenuButton>
    );

    // サブルートでもアクティブ状態になることを確認
    expect(container.querySelector('[data-active="true"]')).toBeInTheDocument();
  });

  it("renders as a link with correct href", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <ActiveSidebarMenuButton href="/admin">
        <span>Admin</span>
      </ActiveSidebarMenuButton>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/admin");
  });
});
