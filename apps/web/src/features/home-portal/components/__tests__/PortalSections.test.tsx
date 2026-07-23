import {
  HOME_PORTAL_CATEGORIES,
  HOME_PORTAL_USE_CASES,
} from "@stats47/data-configs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";


const { navMock } = vi.hoisted(() => ({ navMock: vi.fn() }));
vi.mock("@/lib/analytics/events", () => ({
  trackNavClick: (...args: unknown[]) => navMock(...args),
}));

import { PortalAreaEntry } from "../PortalAreaEntry";
import { PortalCategoryGrid } from "../PortalCategoryGrid";
import { PortalUseCaseGrid } from "../PortalUseCaseGrid";

describe("PortalCategoryGrid", () => {
  it("代表カテゴリを /category/<key> リンクで描画する", () => {
    render(<PortalCategoryGrid />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(HOME_PORTAL_CATEGORIES.length);
    const population = screen.getByRole("link", { name: /人口・世帯/ });
    expect(population).toHaveAttribute("href", "/category/population");
  });

  it("カテゴリクリックで home_category を計測する", () => {
    navMock.mockClear();
    render(<PortalCategoryGrid />);
    fireEvent.click(screen.getByRole("link", { name: /人口・世帯/ }));
    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "home_category", href: "/category/population" }),
    );
  });
});

describe("PortalUseCaseGrid", () => {
  it("active な use case を /themes/<key> リンクで描画する", () => {
    render(<PortalUseCaseGrid />);
    const active = HOME_PORTAL_USE_CASES.filter((u) => u.isActive);
    expect(screen.getAllByRole("link")).toHaveLength(active.length);
    expect(screen.getByRole("link", { name: /移住先を比較したい/ })).toHaveAttribute(
      "href",
      "/themes/population-dynamics",
    );
  });

  it("use case クリックで home_use_case を計測する", () => {
    navMock.mockClear();
    render(<PortalUseCaseGrid />);
    fireEvent.click(screen.getByRole("link", { name: /移住先を比較したい/ }));
    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "home_use_case" }),
    );
  });
});

describe("PortalAreaEntry", () => {
  it("/areas への軽量な単一入口を描画する", () => {
    render(<PortalAreaEntry />);
    const link = screen.getByRole("link", { name: /都道府県から探す/ });
    expect(link).toHaveAttribute("href", "/areas");
  });

  it("クリックで home_area を計測する", () => {
    navMock.mockClear();
    render(<PortalAreaEntry />);
    fireEvent.click(screen.getByRole("link", { name: /都道府県から探す/ }));
    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "home_area", href: "/areas" }),
    );
  });
});
