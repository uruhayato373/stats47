// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { findStorefrontProduct } from "@/features/products";

import { DataUsageCard } from "../DataUsageCard";

const baseProps = {
  rankingKey: "financial-strength-index",
  areaType: "prefecture" as const,
  displayInfo: { title: "財政力指数", subtitle: "", demographicAttr: null, normalizationBasis: null },
  categoryKey: "administrativefinancial",
};

describe("DataUsageCard", () => {
  it("CSV は href のリンク、KML / GeoJSON は href を持たないボタンで押すと同じ URL へ移る (検索エンジンに辿らせない)", () => {
    const { container } = render(<DataUsageCard {...baseProps} normalizationType="per_population" hasAllBases />);
    // CSV は全基準まとめのまま
    expect(screen.getByRole("link", { name: "ダウンロード" }).getAttribute("href")).toContain("basis=all-bases");
    expect(container.innerHTML).not.toMatch(/href="[^"]*format=(kml|geojson)/);
    expect(screen.queryByRole("link", { name: "KML" })).toBeNull();

    const original = window.location;
    let assigned = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin: original.origin,
        protocol: original.protocol,
        host: original.host,
        hostname: original.hostname,
        pathname: original.pathname,
        search: original.search,
        get href() {
          return original.href;
        },
        set href(v: string) {
          assigned = v;
        },
      },
    });
    try {
      fireEvent.click(screen.getByRole("button", { name: "KML" }));
      expect(assigned).toBe("/api/ranking/financial-strength-index/download?format=kml&basis=per_population");
      fireEvent.click(screen.getByRole("button", { name: "GeoJSON" }));
      expect(assigned).toContain("format=geojson");
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });

  it("CSV を落とす前から、その分野のデータ集を案内する", () => {
    render(<DataUsageCard {...baseProps} />);
    const product = screen.getByRole("link", { name: new RegExp(findStorefrontProduct("data-p-04")!.title) });
    expect(product.getAttribute("href")).toBe("/products/data-p-04");
    expect(screen.getByText(findStorefrontProduct('data-p-04')!.title, { exact: false })).toBeTruthy();
  });

  it("「学習・研究」と答えた人には出典の書き方を示す", () => {
    render(<DataUsageCard {...baseProps} />);
    fireEvent.click(screen.getByRole("link", { name: "ダウンロード" }));
    fireEvent.click(screen.getByRole("button", { name: "学習・研究" }));
    expect(screen.getByText(/stats47 にて加工/)).toBeTruthy();
  });
});
