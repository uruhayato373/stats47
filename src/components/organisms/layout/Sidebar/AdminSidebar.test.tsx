import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminSidebar } from "./AdminSidebar";

describe("AdminSidebar", () => {
  it("renders all admin sections", () => {
    render(<AdminSidebar />);

    // Dashboard section
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("概要")).toBeInTheDocument();

    // e-STAT API section
    expect(screen.getByText("e-STAT API")).toBeInTheDocument();

    // Development Tools section
    expect(screen.getByText("開発ツール")).toBeInTheDocument();
    expect(screen.getByText("データベース")).toBeInTheDocument();
    expect(screen.getByText("ログ")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: /概要/i })).toHaveAttribute(
      "href",
      "/admin"
    );
    expect(screen.getByRole("link", { name: /データベース/i })).toHaveAttribute(
      "href",
      "/admin/database"
    );
    expect(screen.getByRole("link", { name: /ログ/i })).toHaveAttribute(
      "href",
      "/admin/logs"
    );
  });

  it("has proper sidebar structure", () => {
    const { container } = render(<AdminSidebar />);

    // Sidebarコンポーネントの基本構造を確認
    expect(
      container.querySelector('[data-sidebar="sidebar"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-sidebar="content"]')
    ).toBeInTheDocument();
  });

  it("renders e-STAT API navigation items", () => {
    render(<AdminSidebar />);

    // e-STAT APIセクション内のナビゲーションアイテムを確認
    const estatSection = screen
      .getByText("e-STAT API")
      .closest('[data-sidebar="group"]');
    expect(estatSection).toBeInTheDocument();
  });

  it("has collapsible set to none", () => {
    const { container } = render(<AdminSidebar />);

    // collapsible="none"が設定されていることを確認
    const sidebar = container.querySelector('[data-sidebar="sidebar"]');
    expect(sidebar).toHaveAttribute("data-collapsible", "none");
  });
});
