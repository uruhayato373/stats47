import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KPI_SWITCHER_THEMES } from "../../config/kpi-switcher-themes";

/**
 * KPI タイル切替 UI のパイロットゲート契約。
 *
 * パイロット中は labor-wages だけが新 UI で、他テーマは旧カードグリッドのまま。
 * この分岐が壊れると「全テーマが一斉に切り替わる」か「パイロットが効かない」の
 * どちらかになり、GA4 の対照比較が成立しなくなる。
 */

vi.mock("../MetricSwitcherPanel", () => ({
  MetricSwitcherPanel: () => <div data-testid="switcher-panel" />,
}));
vi.mock("../ThemeDbChartRenderer", () => ({
  ThemeDbChartRenderer: () => <div />,
}));
vi.mock("../../actions", () => ({
  fetchMetricTimeseriesAction: vi.fn().mockResolvedValue({ points: [], source: "none" }),
}));

import { ThemeMetricsDashboard } from "../ThemeMetricsDashboard";

import type { ThemeConfig, ThemeIndicatorData } from "../../types";

const METRIC_KEY = "wage";

/** KPI に採用されるには MIN_VALUES_FOR_KPI (=10) 以上の観測が要る */
const indicatorDataMap: Record<string, ThemeIndicatorData> = {
  [METRIC_KEY]: {
    rankingItem: { title: "賃金", unit: "円" },
    rankingValues: Array.from({ length: 12 }, (_, i) => ({
      areaCode: String(i + 1).padStart(5, "0"),
      value: 100 + i,
      rank: i + 1,
    })),
    nationalSeries: [
      { year: 2020, value: 1 },
      { year: 2021, value: 2 },
    ],
  } as unknown as ThemeIndicatorData,
};

function themeConfig(themeKey: string): ThemeConfig {
  return {
    themeKey,
    tabIndicators: [{ rankingKey: METRIC_KEY, tabLabel: "賃金" }],
    defaultRankingKey: METRIC_KEY,
  } as unknown as ThemeConfig;
}

function renderDashboard(themeKey: string) {
  return render(
    <ThemeMetricsDashboard
      themeConfig={themeConfig(themeKey)}
      indicatorDataMap={indicatorDataMap}
      selectedPrefectureCode={null}
      mapless
    />,
  );
}

describe("KPI タイル切替のパイロットゲート", () => {
  it("パイロット対象は labor-wages 1 件だけ (無条件展開になっていない)", () => {
    expect([...KPI_SWITCHER_THEMES]).toEqual(["labor-wages"]);
  });

  it("labor-wages は切替パネルを描き、旧カードグリッドを描かない", () => {
    renderDashboard("labor-wages");
    expect(screen.getByTestId("switcher-panel")).toBeInTheDocument();
    // 旧カードの導線 (カード footer のランキングリンク) は出ない
    expect(screen.queryByRole("link", { name: /ランキングを見る/ })).toBeNull();
  });

  it("対象外テーマは旧カードグリッドのまま (切替パネルを描かない)", () => {
    renderDashboard("population-dynamics");
    expect(screen.queryByTestId("switcher-panel")).toBeNull();
    expect(screen.getByRole("link", { name: /ランキングを見る/ })).toHaveAttribute(
      "href",
      `/ranking/${METRIC_KEY}`,
    );
  });
});
