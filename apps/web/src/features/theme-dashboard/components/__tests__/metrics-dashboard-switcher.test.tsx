import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * ThemeMetricsDashboard が KPI をどう描くかの契約。
 *
 * 2026-08-05 に全テーマを KPI タイル切替 (MetricSwitcherPanel) へ統一した。
 * 旧 ChartCard グリッドは「タイルのミニチャート」と「下段の時系列チャート」で
 * 同じ事実を二度描いていたため廃止した。ここで固定したいのは:
 *  (a) どのテーマでも切替パネルになる (テーマ別の分岐を復活させない)
 *  (b) 旧グリッドの一括全国 fetch を復活させない (初期表示が遅くなる)
 */

vi.mock("../MetricSwitcherPanel", () => ({
  MetricSwitcherPanel: ({ metrics }: { metrics: { metricKey: string }[] }) => (
    <div data-testid="switcher-panel" data-keys={metrics.map((m) => m.metricKey).join(",")} />
  ),
}));
vi.mock("../ThemeDbChartRenderer", () => ({
  ThemeDbChartRenderer: () => <div />,
}));

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock("../../actions", () => ({
  fetchMetricTimeseriesAction: (...args: unknown[]) => fetchMock(...args),
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

describe("ThemeMetricsDashboard — KPI の描画", () => {
  it.each(["labor-wages", "population-dynamics", "safety", "occupation-salary"])(
    "%s で切替パネルを描く (テーマ別の分岐を持たない)",
    (themeKey) => {
      renderDashboard(themeKey);
      expect(screen.getByTestId("switcher-panel")).toBeInTheDocument();
    },
  );

  it("旧 ChartCard グリッドの導線を描かない (二重表示の復活防止)", () => {
    renderDashboard("population-dynamics");
    // 旧グリッドは各カード footer に /ranking/<key> リンクを持っていた。
    // 現在この導線は切替パネル内のフッター 1 本だけが担う (パネルは mock 済 = 0 本)
    expect(screen.queryByRole("link", { name: /ランキングを見る/ })).toBeNull();
  });

  it("★KPI の一括全国 fetch を行わない (選択指標だけをパネルが遅延取得する)", () => {
    fetchMock.mockClear();
    renderDashboard("population-dynamics");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("タイルには tabIndicators 由来の指標が渡る", () => {
    renderDashboard("labor-wages");
    expect(screen.getByTestId("switcher-panel")).toHaveAttribute("data-keys", METRIC_KEY);
  });
});
