import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { readMock, trackNavClickMock } = vi.hoisted(() => ({
  readMock: vi.fn(),
  trackNavClickMock: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@stats47/correlation/server", () => ({
  readThemeCorrelatedMetricsFromR2: (themeKey: string) => readMock(themeKey),
}));
vi.mock("@/lib/analytics/events", () => ({
  trackNavClick: (...args: unknown[]) => trackNavClickMock(...args),
}));

import { ThemeCorrelatedMetrics } from "../ThemeCorrelatedMetrics";

const item = {
  rankingKey: "kerosene-consumption-quantity",
  title: "灯油消費量",
  populationAdjustedR: -0.87,
  via: { rankingKey: "annual-average-temperature", title: "年平均気温" },
};

describe("ThemeCorrelatedMetrics", () => {
  beforeEach(() => {
    readMock.mockReset();
    trackNavClickMock.mockReset();
  });

  // テーマ外の指標へ出る導線。どのテーマ内指標との関係かを添えないと、なぜ並ぶのか読めない
  it("テーマ外の指標をランキングへリンクし、経由したテーマ内の指標と相関を添える", async () => {
    readMock.mockResolvedValue({ success: true, data: [item] });

    render(await ThemeCorrelatedMetrics({ themeKey: "climate" }));

    expect(readMock).toHaveBeenCalledWith("climate");
    const link = screen.getByRole("link", { name: /灯油消費量/ });
    expect(link).toHaveAttribute("href", "/ranking/kerosene-consumption-quantity");
    expect(link).toHaveTextContent("年平均気温との相関");
    expect(link).toHaveTextContent("-0.87");

    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);
    expect(trackNavClickMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "theme_ranking", label: "theme-correlated-metrics:kerosene-consumption-quantity" }),
    );
  });

  it.each([
    ["関連指標が無い", { success: true, data: [] }],
    ["読み込みに失敗した", { success: false, error: new Error("R2 down") }],
  ])("%s ときはセクションを出さない", async (_label, result) => {
    readMock.mockResolvedValue(result);

    expect(await ThemeCorrelatedMetrics({ themeKey: "climate" })).toBeNull();
  });
});
