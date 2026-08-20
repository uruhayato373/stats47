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
 *  (c) metricGroups があればグループ数ぶんのカードに分かれ、無ければ 1 枚に倒す
 *      (2026-08-06。カタログ未登録のテーマを壊さないためのフォールバック)
 */

vi.mock("../MetricSwitcherPanel", () => ({
  MetricSwitcherPanel: ({
    metrics,
    title,
    defaultCheckedKeys,
  }: {
    metrics: { metricKey: string }[];
    title?: string;
    defaultCheckedKeys?: string[];
  }) => (
    <div
      data-testid="switcher-panel"
      data-keys={metrics.map((m) => m.metricKey).join(",")}
      data-title={title ?? ""}
      data-default={(defaultCheckedKeys ?? []).join(",")}
    />
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
function indicatorData(title: string, unit: string, valueCount = 12): ThemeIndicatorData {
  return {
    rankingItem: { title, unit },
    rankingValues: Array.from({ length: valueCount }, (_, i) => ({
      areaCode: String(i + 1).padStart(5, "0"),
      value: 100 + i,
      rank: i + 1,
    })),
    nationalSeries: [
      { year: 2020, value: 1 },
      { year: 2021, value: 2 },
    ],
  } as unknown as ThemeIndicatorData;
}

const indicatorDataMap: Record<string, ThemeIndicatorData> = {
  [METRIC_KEY]: indicatorData("賃金", "円"),
  ratio: indicatorData("有効求人辺率", "倍"),
  telework: indicatorData("テレワーク率", "％"),
  /** 観測 3 件 = MIN_VALUES_FOR_KPI 未満なので KPI に採用されない */
  thin: indicatorData("観測不足", "円", 3),
};

function themeConfig(themeKey: string, keys: string[] = [METRIC_KEY]): ThemeConfig {
  return {
    themeKey,
    tabIndicators: keys.map((k) => ({ rankingKey: k, tabLabel: k })),
    defaultRankingKey: keys[0],
  } as unknown as ThemeConfig;
}

function renderDashboard(
  themeKey: string,
  over: Partial<React.ComponentProps<typeof ThemeMetricsDashboard>> = {},
) {
  return render(
    <ThemeMetricsDashboard
      themeConfig={themeConfig(themeKey)}
      indicatorDataMap={indicatorDataMap}
      selectedPrefectureCode={null}
      {...over}
    />,
  );
}

function panels() {
  return screen.getAllByTestId("switcher-panel");
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

  it("主要指標の重複見出しは読み上げ用だけに残す ('47都道府県'、'全国'ではない)", () => {
    renderDashboard("education-culture");
    expect(screen.getByRole("heading", { name: "47都道府県の主要指標" })).toHaveClass("sr-only");
  });

  it("タイルには tabIndicators 由来の指標が渡る", () => {
    renderDashboard("labor-wages");
    expect(screen.getByTestId("switcher-panel")).toHaveAttribute("data-keys", METRIC_KEY);
  });
});

describe("ThemeMetricsDashboard — 指標カードの編成 (metricGroups)", () => {
  const THREE = [METRIC_KEY, "ratio", "telework"];

  it("metricGroups があればグループ数ぶんのカードに分かれる", () => {
    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig("labor-wages", THREE)}
        metricGroups={[
          { key: "level", title: "賃金の水準", rankingKeys: [METRIC_KEY], defaultCheckedKeys: [METRIC_KEY] },
          {
            key: "market",
            title: "労働市場",
            rankingKeys: ["ratio", "telework"],
            defaultCheckedKeys: ["ratio", "telework"],
          },
        ]}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />,
    );
    const found = panels();
    expect(found).toHaveLength(2);
    expect(found[0]).toHaveAttribute("data-title", "賃金の水準");
    expect(found[0]).toHaveAttribute("data-keys", METRIC_KEY);
    expect(found[1]).toHaveAttribute("data-title", "労働市場");
    expect(found[1]).toHaveAttribute("data-keys", "ratio,telework");
    expect(found[1]).toHaveAttribute("data-default", "ratio,telework");
  });

  it("metricGroups 未定義なら全 KPI を 1 枚に倒す (カタログ未登録テーマを壊さない)", () => {
    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig("climate", THREE)}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />,
    );
    const found = panels();
    expect(found).toHaveLength(1);
    expect(found[0]).toHaveAttribute("data-keys", THREE.join(","));
    // 見出しは section の h2 が言うのでパネル側には渡さない
    expect(found[0]).toHaveAttribute("data-title", "");
    expect(found[0]).toHaveAttribute("data-default", METRIC_KEY);
  });

  it("観測不足で KPI から落ちたキーはグループからも除き、初期チェックを生存キーに絞る", () => {
    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig("labor-wages", [METRIC_KEY, "thin"])}
        metricGroups={[
          {
            key: "level",
            title: "賃金の水準",
            rankingKeys: [METRIC_KEY, "thin"],
            defaultCheckedKeys: [METRIC_KEY, "thin"],
          },
        ]}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />,
    );
    const found = panels();
    expect(found).toHaveLength(1);
    expect(found[0]).toHaveAttribute("data-keys", METRIC_KEY);
    expect(found[0]).toHaveAttribute("data-default", METRIC_KEY);
  });

  it("グループの指標が全滅したらそのカードは描かない (空カードを置かない)", () => {
    render(
      <ThemeMetricsDashboard
        themeConfig={themeConfig("labor-wages", [METRIC_KEY, "thin"])}
        metricGroups={[
          { key: "level", title: "賃金の水準", rankingKeys: [METRIC_KEY], defaultCheckedKeys: [METRIC_KEY] },
          { key: "dead", title: "観測不足のみ", rankingKeys: ["thin"], defaultCheckedKeys: ["thin"] },
        ]}
        indicatorDataMap={indicatorDataMap}
        selectedPrefectureCode={null}
      />,
    );
    const found = panels();
    expect(found).toHaveLength(1);
    expect(found[0]).toHaveAttribute("data-title", "賃金の水準");
  });
});
