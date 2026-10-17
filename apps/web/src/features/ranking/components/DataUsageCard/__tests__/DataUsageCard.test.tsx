// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataUsageCard } from "../DataUsageCard";

const baseProps = {
  rankingKey: "financial-strength-index",
  areaType: "prefecture" as const,
  displayInfo: { title: "財政力指数", subtitle: "", demographicAttr: null, normalizationBasis: null },
  categoryKey: "administrativefinancial",
};

describe("DataUsageCard", () => {
  it("CSV に加えて、表示中の基準で地図用の KML / GeoJSON を出す", () => {
    render(<DataUsageCard {...baseProps} normalizationType="per_population" hasAllBases />);
    expect(screen.getByRole("link", { name: "KML" }).getAttribute("href")).toBe(
      "/api/ranking/financial-strength-index/download?format=kml&basis=per_population"
    );
    expect(screen.getByRole("link", { name: "GeoJSON" }).getAttribute("href")).toContain("format=geojson");
    // CSV は全基準まとめのまま
    expect(screen.getByRole("link", { name: "ダウンロード" }).getAttribute("href")).toContain("basis=all-bases");
  });

  it("「業務の資料」と答えた人に、その分野のデータ集を案内する", () => {
    render(<DataUsageCard {...baseProps} />);
    fireEvent.click(screen.getByRole("link", { name: "ダウンロード" }));
    fireEvent.click(screen.getByRole("button", { name: "業務の資料" }));
    const product = screen.getByRole("link", { name: "内容と条件を確認する" });
    expect(product.getAttribute("href")).toBe("/products/data-p-04");
    expect(screen.getByText(/自治体財政データ集/)).toBeTruthy();
  });

  it("「学習・研究」と答えた人には出典の書き方を示し、商品は出さない", () => {
    render(<DataUsageCard {...baseProps} />);
    fireEvent.click(screen.getByRole("link", { name: "ダウンロード" }));
    fireEvent.click(screen.getByRole("button", { name: "学習・研究" }));
    expect(screen.getByText(/stats47 にて加工/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "内容と条件を確認する" })).toBeNull();
  });
});
