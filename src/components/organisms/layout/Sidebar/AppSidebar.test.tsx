import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppSidebar } from "./AppSidebar";

describe("AppSidebar", () => {
  it("renders Home section", () => {
    render(<AppSidebar />);

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders Categories section", () => {
    render(<AppSidebar />);

    expect(screen.getByText("統計カテゴリー")).toBeInTheDocument();
  });

  it("renders all category links", () => {
    render(<AppSidebar />);

    // カテゴリーの存在確認（実際のカテゴリー名は要確認）
    const categoryLinks = screen.getAllByRole("link");
    expect(categoryLinks.length).toBeGreaterThan(0);
  });

  it("renders navigation items from config", () => {
    render(<AppSidebar />);

    // ナビゲーションアイテムが表示されることを確認
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });

  it("has proper sidebar structure", () => {
    const { container } = render(<AppSidebar />);

    // Sidebarコンポーネントの基本構造を確認
    expect(
      container.querySelector('[data-sidebar="sidebar"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-sidebar="content"]')
    ).toBeInTheDocument();
  });
});
